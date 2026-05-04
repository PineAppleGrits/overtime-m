import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { MATCH_STATUS } from '../../domain/rules/transitions.rules';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
  MatchRow,
} from '../ports/match-repository.port';

export interface RecordMutualCancelInput {
  matchId: string;
  reason?: string;
}

/**
 * RN-056 — Cancelación mutua: ambos equipos cancelan. El partido queda
 * registrado como jugado con marcador 0-0, no suma puntos para nadie
 * (RN-024).
 */
@Injectable()
export class RecordMutualCancelUseCase {
  private readonly logger = new Logger(RecordMutualCancelUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: RecordMutualCancelInput): Promise<MatchRow> {
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
      row.status !== MATCH_STATUS.REPROGRAMADO
    ) {
      throw new BusinessError(
        ErrorCode.MATCH_INVALID_STATUS_TRANSITION,
        `No se puede registrar cancelación mutua en estado "${row.status}".`,
        HttpStatus.CONFLICT,
        { matchId: row.id, currentStatus: row.status },
      );
    }

    const updated = await this.repo.updateRaw(row.id, {
      status: MATCH_STATUS.FINALIZADO,
      homeScore: 0,
      awayScore: 0,
    });

    this.events.emit(DomainEvent.MATCH_FINISHED, {
      matchId: updated.id,
      homeScore: 0,
      awayScore: 0,
      homeTeamId: updated.homeTeamId,
      awayTeamId: updated.awayTeamId,
      countsForStandings: false, // RN-024 — 0-0 administrativo
      resolution: 'mutual_cancel',
    } satisfies DomainEventPayloads['match.finished']);

    this.logger.log(
      `Match ${row.id} mutual cancel — 0-0 administrativo (RN-056)`,
    );
    return updated;
  }
}
