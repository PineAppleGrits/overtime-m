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

export interface ResolveSuspendedMatchInput {
  matchId: string;
  resolution: 'reanudar' | 'fin_sin_continuidad';
  /** Si fin_sin_continuidad, score final administrativo. */
  currentScore?: { home: number; away: number };
  winningTeamId?: string;
  resolvedBy: string;
}

/**
 * RN-055 — Para partidos en `suspendido_pendiente`, el admin define la
 * resolución (reanudar o fin_sin_continuidad).
 */
@Injectable()
export class ResolveSuspendedMatchUseCase {
  private readonly logger = new Logger(ResolveSuspendedMatchUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: ResolveSuspendedMatchInput): Promise<MatchRow> {
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

    if (!match.isSuspendedPending()) {
      throw new BusinessError(
        ErrorCode.MATCH_NOT_SUSPENDED,
        'El partido no está en estado "suspendido_pendiente".',
        HttpStatus.CONFLICT,
        { matchId: match.id, currentStatus: match.status },
      );
    }

    if (input.resolution === 'fin_sin_continuidad') {
      const score = input.currentScore ?? {
        home: row.homeScore,
        away: row.awayScore,
      };
      const updated = await this.repo.updateRaw(match.id, {
        status: MATCH_STATUS.FINALIZADO_CON_RESOLUCION,
        homeScore: score.home,
        awayScore: score.away,
      });

      this.events.emit(DomainEvent.MATCH_RESOLVED, {
        matchId: updated.id,
        resolution: 'fin_sin_continuidad',
        resolvedBy: input.resolvedBy,
      } satisfies DomainEventPayloads['match.resolved']);

      this.events.emit(DomainEvent.MATCH_FINISHED, {
        matchId: updated.id,
        homeScore: score.home,
        awayScore: score.away,
        homeTeamId: updated.homeTeamId,
        awayTeamId: updated.awayTeamId,
        countsForStandings: true,
        resolution: 'suspended_no_continuation',
      } satisfies DomainEventPayloads['match.finished']);

      this.logger.log(
        `Match ${match.id} resolved → fin_sin_continuidad by ${input.resolvedBy}`,
      );
      return updated;
    }

    // reanudar
    const updated = await this.repo.updateRaw(match.id, {
      status: MATCH_STATUS.SUSPENDIDO_A_REANUDAR,
    });

    this.events.emit(DomainEvent.MATCH_RESOLVED, {
      matchId: updated.id,
      resolution: 'reanudar',
      resolvedBy: input.resolvedBy,
    } satisfies DomainEventPayloads['match.resolved']);

    this.logger.log(`Match ${match.id} resolved → reanudar by ${input.resolvedBy}`);
    return updated;
  }
}
