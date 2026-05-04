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

export interface MarkPlayedInput {
  friendlyId: string;
}

/**
 * Marca un amistoso como PLAYED. Se usa después de que el match resultante
 * pasa a FINALIZADO (vía listener de match.finished con matchType='amistoso')
 * o manualmente vía endpoint admin.
 *
 * Idempotente — si ya está PLAYED, no falla, devuelve el snapshot actual.
 */
@Injectable()
export class MarkFriendlyPlayedUseCase {
  private readonly logger = new Logger(MarkFriendlyPlayedUseCase.name);

  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: MarkPlayedInput): Promise<FriendlyWithDeposits> {
    const record = await this.repo.findById(input.friendlyId);
    if (!record) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Amistoso no encontrado',
        HttpStatus.NOT_FOUND,
        { friendlyId: input.friendlyId },
      );
    }

    if (record.status === 'PLAYED') {
      return record; // idempotente
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

    if (!isValidTransition(entity.status, 'PLAYED')) {
      throw new BusinessError(
        ErrorCode.FRIENDLY_INVALID_TRANSITION,
        `No se puede marcar como jugado un amistoso en estado ${entity.status}`,
        HttpStatus.CONFLICT,
        { friendlyId: entity.id, fromStatus: entity.status },
      );
    }

    if (!entity.resultingMatchId) {
      throw new BusinessError(
        ErrorCode.FRIENDLY_INVALID_TRANSITION,
        'No se puede marcar como jugado un amistoso sin partido resultante',
        HttpStatus.CONFLICT,
        { friendlyId: entity.id },
      );
    }

    const updated = await this.repo.updateState(entity.id, {
      status: 'PLAYED',
    });

    this.eventEmitter.emit(DomainEvent.FRIENDLY_PLAYED, {
      friendlyId: entity.id,
      matchId: entity.resultingMatchId!,
      homeTeamId: entity.homeTeamId,
      awayTeamId: entity.awayTeamId,
    } satisfies DomainEventPayloads['friendly.played']);

    this.logger.log(`Friendly marked as played: ${entity.id}`);

    return updated;
  }
}
