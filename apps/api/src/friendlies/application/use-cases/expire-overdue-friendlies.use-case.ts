import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Friendly } from '../../domain/entities/friendly.entity';
import {
  FRIENDLY_REPOSITORY,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';
import {
  FRIENDLY_DEPOSIT_SERVICE,
  IFriendlyDepositService,
} from '../ports/friendly-deposit-service.port';

export interface ExpireOverdueResult {
  expiredCount: number;
  expiredIds: string[];
}

/**
 * RN-023 — caso de uso del cron: para cada Friendly en GENERATED o
 * PENDING_CONFIRMATION cuyo confirmationDeadline ya pasó, cancelar las
 * señas asociadas y marcar Friendly.status = EXPIRED.
 *
 * Idempotente: si entra de nuevo y los amistosos ya están EXPIRED, no
 * volvemos a tocarlos (el filtro `findOverduePending` excluye terminales).
 */
@Injectable()
export class ExpireOverdueFriendliesUseCase {
  private readonly logger = new Logger(ExpireOverdueFriendliesUseCase.name);

  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    @Inject(FRIENDLY_DEPOSIT_SERVICE)
    private readonly depositService: IFriendlyDepositService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(now: Date = new Date()): Promise<ExpireOverdueResult> {
    const overdue = await this.repo.findOverduePending(now);
    const expiredIds: string[] = [];

    for (const record of overdue) {
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

      // Doble guarda — el repositorio ya filtra, pero protegemos contra
      // race condition entre tomar el lock y queryear.
      if (
        !entity.isPendingDeposit() ||
        !entity.isDepositWindowExpired(now)
      ) {
        continue;
      }

      try {
        await this.depositService.cancelDepositsForFriendly(
          entity.id,
          'Ventana de confirmación de 24hs vencida (RN-023)',
        );
        await this.repo.updateState(entity.id, {
          status: 'EXPIRED',
        });

        this.eventEmitter.emit(DomainEvent.FRIENDLY_EXPIRED, {
          friendlyId: entity.id,
        } satisfies DomainEventPayloads['friendly.expired']);

        expiredIds.push(entity.id);
        this.logger.log(`Friendly expired: ${entity.id}`);
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Friendly ${entity.id} — error al expirar: ${error.message}`,
          error.stack,
        );
        // continuamos con los siguientes amistosos
      }
    }

    return { expiredCount: expiredIds.length, expiredIds };
  }
}
