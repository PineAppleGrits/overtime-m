import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Match } from '../../domain/entities/match.entity';
import { MATCH_STATUS } from '../../domain/rules/transitions.rules';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
  MatchRow,
} from '../ports/match-repository.port';

export type SuspensionResolution =
  | 'reanudar'
  | 'fin_sin_continuidad'
  | 'pendiente';

export interface SuspendMatchInput {
  matchId: string;
  reason: string;
  /** Score parcial al momento de la suspensión (RN-054). */
  currentScore?: { home: number; away: number };
  resolution: SuspensionResolution;
  /** Solo aplica cuando resolution='fin_sin_continuidad' (RN-054). */
  winningTeamId?: string;
}

/**
 * RN-054 / RN-055 — Suspensión durante encuentro.
 *
 * - reanudar → status `suspendido_a_reanudar`, score parcial guardado.
 * - fin_sin_continuidad → status `finalizado_con_resolucion`, score = currentScore,
 *   emite `match.finished` con `countsForStandings=true` y `resolution=suspended_no_continuation`.
 * - pendiente → status `suspendido_pendiente`, admin resuelve después con
 *   `resolveSuspendedMatch`.
 */
@Injectable()
export class SuspendMatchUseCase {
  private readonly logger = new Logger(SuspendMatchUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: SuspendMatchInput): Promise<MatchRow> {
    const row = await this.repo.findById(input.matchId);
    if (!row) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Partido no encontrado',
        HttpStatus.NOT_FOUND,
        { matchId: input.matchId },
      );
    }

    const match = Match.fromState({
      id: row.id,
      homeTeamId: row.homeTeamId,
      awayTeamId: row.awayTeamId,
      categoryId: row.categoryId,
      zoneId: row.zoneId,
      venueId: row.venueId,
      matchDate: row.matchDate,
      matchTime: row.matchTime,
      status: row.status,
      matchType: row.matchType,
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      costPerTeam: row.costPerTeam,
      seriesId: row.seriesId,
      seriesGameNumber: row.seriesGameNumber,
      playoffStage: row.playoffStage,
    });

    if (!match.canSuspend()) {
      throw new BusinessError(
        ErrorCode.MATCH_INVALID_STATUS_TRANSITION,
        `No se puede suspender un partido en estado "${match.status}".`,
        HttpStatus.CONFLICT,
        { matchId: match.id, currentStatus: match.status },
      );
    }

    if (input.resolution === 'fin_sin_continuidad') {
      if (!input.currentScore) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'currentScore es requerido cuando resolution="fin_sin_continuidad".',
          HttpStatus.BAD_REQUEST,
        );
      }
      const updated = await this.repo.updateRaw(match.id, {
        status: MATCH_STATUS.FINALIZADO_CON_RESOLUCION,
        homeScore: input.currentScore.home,
        awayScore: input.currentScore.away,
      });

      this.events.emit(DomainEvent.MATCH_SUSPENDED, {
        matchId: updated.id,
        reason: input.reason,
        currentScore: input.currentScore,
        resolution: 'fin_sin_continuidad',
      } satisfies DomainEventPayloads['match.suspended']);

      // Emitir match.finished para que standings cuente: el partido terminó
      // con resolución administrativa, RN-054.
      this.events.emit(DomainEvent.MATCH_FINISHED, {
        matchId: updated.id,
        homeScore: input.currentScore.home,
        awayScore: input.currentScore.away,
        homeTeamId: updated.homeTeamId,
        awayTeamId: updated.awayTeamId,
        countsForStandings: true,
        resolution: 'suspended_no_continuation',
      } satisfies DomainEventPayloads['match.finished']);

      this.logger.log(
        `Match ${match.id} suspended → fin_sin_continuidad (winnerTeamId=${input.winningTeamId ?? 'n/a'})`,
      );
      return updated;
    }

    if (input.resolution === 'reanudar') {
      const updated = await this.repo.updateRaw(match.id, {
        status: MATCH_STATUS.SUSPENDIDO_A_REANUDAR,
        ...(input.currentScore
          ? {
              homeScore: input.currentScore.home,
              awayScore: input.currentScore.away,
            }
          : {}),
      });

      this.events.emit(DomainEvent.MATCH_SUSPENDED, {
        matchId: updated.id,
        reason: input.reason,
        currentScore: input.currentScore,
        resolution: 'reanudar',
      } satisfies DomainEventPayloads['match.suspended']);

      this.logger.log(`Match ${match.id} suspended → reanudar`);
      return updated;
    }

    // pendiente
    const updated = await this.repo.updateRaw(match.id, {
      status: MATCH_STATUS.SUSPENDIDO_PENDIENTE,
      ...(input.currentScore
        ? {
            homeScore: input.currentScore.home,
            awayScore: input.currentScore.away,
          }
        : {}),
    });

    this.events.emit(DomainEvent.MATCH_SUSPENDED, {
      matchId: updated.id,
      reason: input.reason,
      currentScore: input.currentScore,
      resolution: 'pendiente',
    } satisfies DomainEventPayloads['match.suspended']);

    this.logger.log(`Match ${match.id} suspended → pendiente`);
    return updated;
  }
}
