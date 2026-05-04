import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Friendly } from '../../domain/entities/friendly.entity';
import { isValidTransition } from '../../domain/rules/transitions';
import {
  FRIENDLY_REPOSITORY,
  FriendlyWithDeposits,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';
import {
  FRIENDLY_DEPOSIT_SERVICE,
  IFriendlyDepositService,
} from '../ports/friendly-deposit-service.port';
import {
  FRIENDLY_CONTEXT,
  IFriendlyContext,
} from '../ports/friendly-context.port';
import {
  FRIENDLY_NOTIFIER,
  IFriendlyNotifier,
} from '../ports/friendly-notifier.port';

export interface GenerateFriendlyInput {
  friendlyId: string;
  /**
   * Monto de la seña por equipo (cada Debt). RN-022 + DP-017 (relación con
   * costo total — TODO).
   */
  depositAmount: number;
  /** Default 'ARS'. */
  currency?: string;
  /** Admin que ejecuta la acción. */
  generatedByProfileId: string;
  /**
   * RN-023 — ventana de confirmación. Default 24hs desde ahora.
   */
  confirmationWindowHours?: number;
}

/**
 * RN-022 + RN-023 — Generación administrativa de un amistoso.
 *
 * Pasos:
 * 1. Carga friendly y valida transición REQUESTED → GENERATED.
 * 2. Crea 2 Debts (FRIENDLY_DEPOSIT) con dueDate = now + 24h.
 * 3. Actualiza friendly.status = GENERATED, confirmationDeadline,
 *    generatedByProfileId, generatedAt.
 * 4. Notifica a delegados de ambos equipos.
 * 5. Emite `friendly.generated`.
 */
@Injectable()
export class GenerateFriendlyUseCase {
  private readonly logger = new Logger(GenerateFriendlyUseCase.name);

  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    @Inject(FRIENDLY_DEPOSIT_SERVICE)
    private readonly depositService: IFriendlyDepositService,
    @Inject(FRIENDLY_CONTEXT)
    private readonly context: IFriendlyContext,
    @Inject(FRIENDLY_NOTIFIER)
    private readonly notifier: IFriendlyNotifier,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: GenerateFriendlyInput): Promise<FriendlyWithDeposits> {
    if (input.depositAmount <= 0) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'El monto de la seña debe ser mayor a cero',
        HttpStatus.BAD_REQUEST,
        { depositAmount: input.depositAmount },
      );
    }

    const record = await this.repo.findById(input.friendlyId);
    if (!record) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Amistoso no encontrado',
        HttpStatus.NOT_FOUND,
        { friendlyId: input.friendlyId },
      );
    }

    const entity = Friendly.fromState({
      id: record.id,
      sportId: record.sportId,
      modality: record.modality,
      homeTeamId: record.homeTeamId,
      awayTeamId: record.awayTeamId,
      proposedDate: record.proposedDate,
      venueId: record.venueId,
      status: record.status,
      notes: record.notes,
      confirmationDeadline: record.confirmationDeadline,
      resultingMatchId: record.resultingMatchId,
      observedForCategorization: record.observedForCategorization,
      createdByProfileId: record.createdByProfileId,
      generatedByProfileId: record.generatedByProfileId,
      generatedAt: record.generatedAt,
      cancelledAt: record.cancelledAt,
      cancellationReason: record.cancellationReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (!isValidTransition(entity.status, 'GENERATED')) {
      throw new BusinessError(
        ErrorCode.FRIENDLY_INVALID_TRANSITION,
        `No se puede generar un amistoso en estado ${entity.status}`,
        HttpStatus.CONFLICT,
        { friendlyId: entity.id, fromStatus: entity.status },
      );
    }

    const now = new Date();
    const windowHours = input.confirmationWindowHours ?? 24;
    const deadline = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
    const currency = input.currency ?? 'ARS';

    // 1) Crear las 2 Debts (FRIENDLY_DEPOSIT)
    await this.depositService.createDeposits({
      friendlyId: entity.id,
      homeTeamId: entity.homeTeamId,
      awayTeamId: entity.awayTeamId,
      depositAmount: input.depositAmount,
      dueDate: deadline,
      createdByProfileId: input.generatedByProfileId,
      currency,
    });

    // 2) Persistir cambios al friendly
    const updated = await this.repo.updateState(entity.id, {
      status: 'GENERATED',
      confirmationDeadline: deadline,
      generatedByProfileId: input.generatedByProfileId,
      generatedAt: now,
    });

    // 3) Notificar
    const teams = await this.context.findTeamsByIds([
      entity.homeTeamId,
      entity.awayTeamId,
    ]);
    const home = teams.find((t) => t.id === entity.homeTeamId);
    const away = teams.find((t) => t.id === entity.awayTeamId);

    const [homeDelegates, awayDelegates] = await Promise.all([
      this.context.findDelegatesForTeam(entity.homeTeamId),
      this.context.findDelegatesForTeam(entity.awayTeamId),
    ]);

    // Dedupe por email — el mismo profile podría ser creator y captain.
    const recipientsMap = new Map<string, { email: string; name: string }>();
    for (const r of [...homeDelegates, ...awayDelegates]) {
      if (r.email && !recipientsMap.has(r.email)) {
        recipientsMap.set(r.email, { email: r.email, name: r.name });
      }
    }

    if (recipientsMap.size > 0) {
      await this.notifier.notifyGenerated({
        recipients: Array.from(recipientsMap.values()),
        homeTeamName: home?.name ?? 'Equipo local',
        awayTeamName: away?.name ?? 'Equipo visitante',
        proposedDate: entity.toState().proposedDate,
        confirmationDeadline: deadline,
        depositAmount: input.depositAmount,
        currency,
      });
    } else {
      this.logger.warn(
        `Friendly ${entity.id} generado sin delegados con email — no se envían notificaciones`,
      );
    }

    // 4) Emitir evento
    const payload: DomainEventPayloads['friendly.generated'] = {
      friendlyId: entity.id,
      generatedBy: input.generatedByProfileId,
    };
    this.eventEmitter.emit(DomainEvent.FRIENDLY_GENERATED, payload);

    this.logger.log(
      `Friendly generated: ${entity.id} — deadline ${deadline.toISOString()}`,
    );

    return updated;
  }
}
