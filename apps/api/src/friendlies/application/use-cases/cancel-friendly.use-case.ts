import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Friendly } from '../../domain/entities/friendly.entity';
import {
  FRIENDLY_REPOSITORY,
  FriendlyWithDeposits,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';
import {
  FRIENDLY_DEPOSIT_SERVICE,
  IFriendlyDepositService,
} from '../ports/friendly-deposit-service.port';

export interface CancelFriendlyInput {
  friendlyId: string;
  cancelledByProfileId: string;
  reason?: string;
  /**
   * `true` si el caller ya verificó permiso (admin). Cuando viene de un
   * controller-public, dejamos el chequeo de permisos en el use-case usando
   * `cancelledByProfileId === createdByProfileId`.
   */
  isAdmin?: boolean;
}

/**
 * Cancela un amistoso. Permitido para admin o creator. No permitido si
 * el amistoso ya está CONFIRMED y tiene un Match jugado/finalizado.
 */
@Injectable()
export class CancelFriendlyUseCase {
  private readonly logger = new Logger(CancelFriendlyUseCase.name);

  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    @Inject(FRIENDLY_DEPOSIT_SERVICE)
    private readonly depositService: IFriendlyDepositService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CancelFriendlyInput): Promise<FriendlyWithDeposits> {
    const record = await this.repo.findById(input.friendlyId);
    if (!record) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Amistoso no encontrado',
        HttpStatus.NOT_FOUND,
        { friendlyId: input.friendlyId },
      );
    }

    // Permisos: admin o creator.
    if (
      !input.isAdmin &&
      record.createdByProfileId !== input.cancelledByProfileId
    ) {
      throw new BusinessError(
        ErrorCode.FORBIDDEN,
        'Sólo el creador del amistoso o un administrador pueden cancelarlo',
        HttpStatus.FORBIDDEN,
        { friendlyId: record.id },
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

    const playedAlready = entity.status === 'PLAYED';
    if (!entity.canCancel(playedAlready)) {
      throw new BusinessError(
        ErrorCode.FRIENDLY_INVALID_TRANSITION,
        `No se puede cancelar un amistoso en estado ${entity.status}`,
        HttpStatus.CONFLICT,
        { friendlyId: entity.id, fromStatus: entity.status },
      );
    }

    // Cancelar señas pendientes asociadas (si las hay)
    const reason =
      input.reason ?? 'Amistoso cancelado por el creador o administración';
    await this.depositService.cancelDepositsForFriendly(entity.id, reason);

    const updated = await this.repo.updateState(entity.id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    this.eventEmitter.emit(DomainEvent.FRIENDLY_CANCELLED, {
      friendlyId: entity.id,
      reason,
    } satisfies DomainEventPayloads['friendly.cancelled']);

    this.logger.log(`Friendly cancelled: ${entity.id} — ${reason}`);

    return updated;
  }
}
