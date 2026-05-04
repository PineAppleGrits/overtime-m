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

export type RivalDecision = 'request_points' | 'reschedule';

export interface ResolveRivalDecisionInput {
  matchId: string;
  rivalTeamId: string;
  decision: RivalDecision;
  /** Solo si decision='reschedule'. */
  newDate?: Date;
  /** Permite forzar el equipo "rival" sin pasar por verificación (admin). */
  acting?: 'rival' | 'admin';
}

/**
 * RN-032 — Resolución del rival ante una cancelación dentro del plazo.
 *
 * - `request_points`: el partido se da por finalizado 20-0 a favor del rival.
 *   `match.finished` se emite con `countsForStandings=true`.
 * - `reschedule`: la fecha se actualiza, status vuelve a `programado`.
 */
@Injectable()
export class ResolveRivalDecisionUseCase {
  private readonly logger = new Logger(ResolveRivalDecisionUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: ResolveRivalDecisionInput): Promise<MatchRow> {
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

    if (!match.isInRivalDecisionPending()) {
      throw new BusinessError(
        ErrorCode.MATCH_RIVAL_DECISION_NOT_PENDING,
        'Este partido no está esperando decisión del rival.',
        HttpStatus.CONFLICT,
        { matchId: match.id, currentStatus: match.status },
      );
    }

    if (input.acting !== 'admin' && !match.involvesTeam(input.rivalTeamId)) {
      throw new BusinessError(
        ErrorCode.FORBIDDEN,
        'Solo el equipo rival puede resolver esta cancelación.',
        HttpStatus.FORBIDDEN,
        { matchId: match.id, teamId: input.rivalTeamId },
      );
    }

    if (input.decision === 'request_points') {
      // 20-0 a favor del rival
      const homeIsRival = match.homeTeamId === input.rivalTeamId;
      const awayIsRival = match.awayTeamId === input.rivalTeamId;

      // Si admin actúa, asumimos rival = el que no es cancellingTeam.
      // Sin metadata sobre quién canceló, default: el rival es el que pide
      // los puntos. Si no es ni home ni away, fallar.
      if (!homeIsRival && !awayIsRival) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'rivalTeamId no participa de este partido.',
          HttpStatus.BAD_REQUEST,
          { matchId: match.id, teamId: input.rivalTeamId },
        );
      }

      const homeScore = homeIsRival ? 20 : 0;
      const awayScore = awayIsRival ? 20 : 0;

      const updated = await this.repo.updateRaw(match.id, {
        status: MATCH_STATUS.FINALIZADO,
        homeScore,
        awayScore,
      });

      this.events.emit(DomainEvent.MATCH_FINISHED, {
        matchId: updated.id,
        homeScore,
        awayScore,
        homeTeamId: updated.homeTeamId,
        awayTeamId: updated.awayTeamId,
        countsForStandings: true,
        resolution: 'rival_request_points',
      } satisfies DomainEventPayloads['match.finished']);

      this.logger.log(
        `Match ${match.id} resolved → rival request_points 20-0 (${input.rivalTeamId})`,
      );
      return updated;
    }

    // reschedule
    if (!input.newDate) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'newDate es requerido cuando decision="reschedule".',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousDate = row.matchDate;
    const updated = await this.repo.updateRaw(match.id, {
      status: MATCH_STATUS.PROGRAMADO,
      matchDate: input.newDate,
    });

    this.events.emit(DomainEvent.MATCH_RESCHEDULED, {
      matchId: updated.id,
      previousDate,
      newDate: input.newDate,
      rescheduledBy: input.rivalTeamId,
    } satisfies DomainEventPayloads['match.rescheduled']);

    this.logger.log(
      `Match ${match.id} resolved → rival reschedule (new date ${input.newDate.toISOString()})`,
    );

    return updated;
  }
}
