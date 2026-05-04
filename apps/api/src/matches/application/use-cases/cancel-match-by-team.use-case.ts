import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Match } from '../../domain/entities/match.entity';
import {
  CANCEL_IN_TIME_HOURS,
  hoursUntilMatch,
  meetsRescheduleThreshold,
} from '../../domain/rules/eligibility-checks.rules';
import { MATCH_STATUS } from '../../domain/rules/transitions.rules';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
  MatchRow,
} from '../ports/match-repository.port';

export interface CancelMatchByTeamInput {
  matchId: string;
  cancellingTeamId: string;
  reason?: string;
  /** Inyectable en tests; default = `new Date()`. */
  now?: Date;
}

export interface CancelMatchByTeamOutput {
  match: MatchRow;
  /**
   * - 'auto_reschedule' (RN-052): antelación supera el umbral del torneo →
   *   se reprograma sin penalización (status `reprogramado`, sin decisión rival).
   * - 'rival_decision' (RN-032): dentro del plazo de 72hs pero por debajo del
   *   umbral del torneo → status `pending_rival_decision`.
   */
  outcome: 'auto_reschedule' | 'rival_decision';
}

/**
 * RN-032 — Cancelación en tiempo (con plazo).
 *
 * Lógica:
 * - Si quedan < 72hs hasta el partido → fuera de plazo (cancelación tardía
 *   sale por RN-025 con multa, no por este endpoint).
 * - Si la antelación supera el `Tournament.earlyCancellationThresholdHours`
 *   (DP-013) → reprogramación directa sin decisión del rival (RN-052).
 * - Caso intermedio: status pasa a `pending_rival_decision`. El rival decide
 *   con `resolveRivalDecision` (request_points 20-0 o reprogramar).
 */
@Injectable()
export class CancelMatchByTeamUseCase {
  private readonly logger = new Logger(CancelMatchByTeamUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    input: CancelMatchByTeamInput,
  ): Promise<CancelMatchByTeamOutput> {
    const now = input.now ?? new Date();
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

    if (!match.canCancelByTeam()) {
      throw new BusinessError(
        ErrorCode.MATCH_CANCEL_NOT_ALLOWED,
        `No se puede cancelar un partido en estado "${match.status}". Debe estar "programado".`,
        HttpStatus.CONFLICT,
        { matchId: match.id, currentStatus: match.status },
      );
    }

    if (!match.involvesTeam(input.cancellingTeamId)) {
      throw new BusinessError(
        ErrorCode.FORBIDDEN,
        'El equipo no participa de este partido.',
        HttpStatus.FORBIDDEN,
        { matchId: match.id, teamId: input.cancellingTeamId },
      );
    }

    const hoursLeft = hoursUntilMatch(match.matchDate, now);
    if (hoursLeft < CANCEL_IN_TIME_HOURS) {
      throw new BusinessError(
        ErrorCode.MATCH_CANCEL_WINDOW_EXPIRED,
        `Fuera del plazo de cancelación en tiempo. Restan ${hoursLeft.toFixed(1)}hs y se requieren al menos ${CANCEL_IN_TIME_HOURS}hs.`,
        HttpStatus.CONFLICT,
        {
          matchId: match.id,
          hoursLeft,
          requiredHours: CANCEL_IN_TIME_HOURS,
        },
      );
    }

    const tournamentThreshold =
      // El row tiene category.tournament cuando hay categoría asignada
      (row.category?.tournament as { earlyCancellationThresholdHours?: number | null } | undefined)
        ?.earlyCancellationThresholdHours ?? null;

    // RN-052 — antelación significativa: reprogramación directa sin penalización
    if (
      tournamentThreshold !== null &&
      meetsRescheduleThreshold(match.matchDate, now, tournamentThreshold)
    ) {
      const updated = await this.repo.updateRaw(match.id, {
        status: MATCH_STATUS.REPROGRAMADO,
      });

      this.events.emit(DomainEvent.MATCH_RESCHEDULED, {
        matchId: updated.id,
        previousDate: row.matchDate,
        newDate: row.matchDate, // sin nueva fecha aún — admin la define luego
        reason:
          input.reason ?? 'Cancelación con antelación significativa (RN-052)',
        rescheduledBy: input.cancellingTeamId,
      } satisfies DomainEventPayloads['match.rescheduled']);

      this.events.emit(DomainEvent.MATCH_CANCELLED, {
        matchId: updated.id,
        reason: input.reason,
        cancelledByTeamId: input.cancellingTeamId,
        requiresRivalDecision: false,
      } satisfies DomainEventPayloads['match.cancelled']);

      this.logger.log(
        `Match ${match.id} cancelled by team ${input.cancellingTeamId} → auto reschedule (RN-052)`,
      );

      return { match: updated, outcome: 'auto_reschedule' };
    }

    // RN-032 — entre 72h y umbral: el rival decide
    const updated = await this.repo.updateRaw(match.id, {
      status: MATCH_STATUS.PENDING_RIVAL_DECISION,
    });

    this.events.emit(DomainEvent.MATCH_CANCELLED, {
      matchId: updated.id,
      reason: input.reason,
      cancelledByTeamId: input.cancellingTeamId,
      requiresRivalDecision: true,
    } satisfies DomainEventPayloads['match.cancelled']);

    // TODO: DP-010 — registrar plazo de respuesta del rival.

    this.logger.log(
      `Match ${match.id} cancelled by team ${input.cancellingTeamId} → pending_rival_decision (RN-032)`,
    );

    return { match: updated, outcome: 'rival_decision' };
  }
}
