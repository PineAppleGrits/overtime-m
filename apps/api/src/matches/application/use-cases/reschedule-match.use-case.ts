import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { meetsRescheduleThreshold } from '../../domain/rules/eligibility-checks.rules';
import { MATCH_STATUS } from '../../domain/rules/transitions.rules';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
  MatchRow,
} from '../ports/match-repository.port';

export interface RescheduleMatchInput {
  matchId: string;
  newDate: Date;
  reason?: string;
  /** Default false. Si true, salta el chequeo del umbral (admin override). */
  forceWithoutThreshold?: boolean;
  /** Inyectable en tests. */
  now?: Date;
  performedBy?: string;
}

/**
 * RN-052 — Reprogramación con antelación.
 *
 * - Si la antelación al partido original cumple el umbral del torneo
 *   (`Tournament.earlyCancellationThresholdHours`), reprograma sin
 *   penalización y emite `match.rescheduled`.
 * - Si NO cumple, el endpoint rechaza (la cancelación tardía sale por
 *   RN-025/032, no por este use-case).
 * - `forceWithoutThreshold=true` permite al admin forzar (caso real:
 *   reprogramación operativa de la organización).
 */
@Injectable()
export class RescheduleMatchUseCase {
  private readonly logger = new Logger(RescheduleMatchUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: RescheduleMatchInput): Promise<MatchRow> {
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

    if (
      row.status !== MATCH_STATUS.PROGRAMADO &&
      row.status !== MATCH_STATUS.PENDING_RIVAL_DECISION &&
      row.status !== MATCH_STATUS.SUSPENDIDO &&
      row.status !== MATCH_STATUS.SUSPENDIDO_A_REANUDAR &&
      row.status !== MATCH_STATUS.SUSPENDIDO_PENDIENTE
    ) {
      throw new BusinessError(
        ErrorCode.MATCH_INVALID_STATUS_TRANSITION,
        `No se puede reprogramar un partido en estado "${row.status}".`,
        HttpStatus.CONFLICT,
        { matchId: row.id, currentStatus: row.status },
      );
    }

    if (!input.forceWithoutThreshold) {
      const threshold =
        (row.category?.tournament as { earlyCancellationThresholdHours?: number | null } | undefined)
          ?.earlyCancellationThresholdHours ?? null;

      if (!meetsRescheduleThreshold(row.matchDate, now, threshold)) {
        throw new BusinessError(
          ErrorCode.MATCH_CANCEL_WINDOW_EXPIRED,
          'La antelación al partido no alcanza el umbral del torneo. Use cancelación tardía (RN-025) o forzá con admin.',
          HttpStatus.CONFLICT,
          {
            matchId: row.id,
            matchDate: row.matchDate,
            now,
            thresholdHours: threshold,
          },
        );
      }
    }

    const previousDate = row.matchDate;

    const updated = await this.repo.updateRaw(row.id, {
      matchDate: input.newDate,
      status: MATCH_STATUS.PROGRAMADO,
    });

    this.events.emit(DomainEvent.MATCH_RESCHEDULED, {
      matchId: updated.id,
      previousDate,
      newDate: input.newDate,
      reason: input.reason,
      rescheduledBy: input.performedBy,
    } satisfies DomainEventPayloads['match.rescheduled']);

    this.logger.log(
      `Match ${row.id} rescheduled: ${previousDate.toISOString()} → ${input.newDate.toISOString()}`,
    );

    return updated;
  }
}
