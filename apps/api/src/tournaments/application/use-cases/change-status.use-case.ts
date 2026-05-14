import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TournamentStatus } from '@overtime-mono/shared';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  DomainEvent,
  DomainEventPayloads,
} from '../../../common/events';
import {
  isValidStatusTransition,
  listAllowedTransitions,
} from '../../domain/rules/status-transitions.rules';
import {
  ITournamentRepository,
  TOURNAMENT_REPOSITORY,
  TournamentRecord,
} from '../ports/tournament-repository.port';

export interface ChangeTournamentStatusInput {
  tournamentId: string;
  newStatus: TournamentStatus;
}

/**
 * Caso de uso: cambiar el estado de un torneo validando que la transición
 * sea legal, aplicando guards por estado destino y emitiendo
 * `tournament.status.changed` (ver docs/specs/tournament-state-machine.md).
 */
@Injectable()
export class ChangeTournamentStatusUseCase {
  private readonly logger = new Logger(ChangeTournamentStatusUseCase.name);

  constructor(
    @Inject(TOURNAMENT_REPOSITORY)
    private readonly repo: ITournamentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: ChangeTournamentStatusInput,
  ): Promise<TournamentRecord> {
    const tournament = await this.repo.findById(input.tournamentId);
    if (!tournament) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Torneo con ID ${input.tournamentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    const fromStatus = tournament.status as TournamentStatus;
    const toStatus = input.newStatus;

    if (fromStatus === toStatus) {
      return tournament;
    }

    if (!isValidStatusTransition(fromStatus, toStatus)) {
      const allowed = listAllowedTransitions(fromStatus);
      throw new BusinessError(
        ErrorCode.TOURNAMENT_INVALID_STATUS_TRANSITION,
        `No se puede pasar de ${fromStatus} a ${toStatus}. Transiciones válidas: ${allowed.length ? allowed.join(', ') : '(ninguna — estado terminal)'}.`,
        HttpStatus.BAD_REQUEST,
        {
          tournamentId: tournament.id,
          fromStatus,
          toStatus,
          allowedTransitions: allowed,
        },
      );
    }

    await this.assertGuards(tournament, toStatus);

    const updated = await this.repo.updateStatus(tournament.id, toStatus);

    const payload: DomainEventPayloads['tournament.status.changed'] = {
      tournamentId: tournament.id,
      fromStatus,
      toStatus,
    };
    this.eventEmitter.emit(DomainEvent.TOURNAMENT_STATUS_CHANGED, payload);

    this.logger.log(
      `Tournament status changed: ${tournament.name} ${fromStatus} → ${toStatus}`,
    );

    return updated;
  }

  /**
   * Guards por estado destino (manual transitions).
   * Las transiciones automáticas (job) siguen su propia ruta y no pasan por acá.
   */
  private async assertGuards(
    tournament: TournamentRecord,
    toStatus: TournamentStatus,
  ): Promise<void> {
    switch (toStatus) {
      case TournamentStatus.PUBLISHED: {
        if (
          !tournament.registrationStartDate ||
          !tournament.registrationEndDate
        ) {
          throw new BusinessError(
            ErrorCode.TOURNAMENT_PUBLISH_REQUIRES_DATES,
            'Para publicar el torneo deben estar definidas las fechas de inscripción.',
            HttpStatus.BAD_REQUEST,
            { tournamentId: tournament.id },
          );
        }
        const categoriesCount = await this.repo.countCategories(tournament.id);
        if (categoriesCount === 0) {
          throw new BusinessError(
            ErrorCode.TOURNAMENT_PUBLISH_REQUIRES_CATEGORY,
            'Para publicar el torneo se requiere al menos una categoría.',
            HttpStatus.BAD_REQUEST,
            { tournamentId: tournament.id },
          );
        }
        return;
      }
      case TournamentStatus.PLAYING: {
        const categoriesWithoutFixture =
          await this.repo.findCategoriesWithoutFixture(tournament.id);
        if (categoriesWithoutFixture.length > 0) {
          throw new BusinessError(
            ErrorCode.FIXTURE_INCOMPLETE_FOR_START,
            `Faltan fixtures por generar en algunas categorías: ${categoriesWithoutFixture
              .map((c) => c.name)
              .join(', ')}.`,
            HttpStatus.BAD_REQUEST,
            {
              tournamentId: tournament.id,
              categoriesWithoutFixture,
            },
          );
        }
        return;
      }
      default:
        return;
    }
  }
}
