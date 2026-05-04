import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import {
  Modality,
  SportCode,
} from '../../../common/sport-rules/sport-rules.types';
import { validateMatchScore } from '../../domain/rules/score-validation.rules';
import { MATCH_STATUS } from '../../domain/rules/transitions.rules';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
  MatchRow,
} from '../ports/match-repository.port';

export interface FinishMatchInput {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

/**
 * Aplica score, valida con SportRules y transiciona EN_CURSO → FINALIZADO.
 *
 * Emite `match.finished` con `countsForStandings` (RN-024). El módulo de
 * standings consume el evento — un 0-0 administrativo no suma puntos.
 */
@Injectable()
export class FinishMatchUseCase {
  private readonly logger = new Logger(FinishMatchUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly sportRules: SportRulesRegistry,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: FinishMatchInput): Promise<MatchRow> {
    const row = await this.repo.findByIdWithSport(input.matchId);
    if (!row) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Partido no encontrado',
        HttpStatus.NOT_FOUND,
        { matchId: input.matchId },
      );
    }

    if (row.status !== MATCH_STATUS.EN_CURSO) {
      throw new BusinessError(
        ErrorCode.MATCH_INVALID_STATUS_TRANSITION,
        `Solo se puede finalizar un partido "en_curso" (estado actual: "${row.status}").`,
        HttpStatus.CONFLICT,
        { matchId: row.id, currentStatus: row.status },
      );
    }

    const sportCode = (row.category?.tournament?.sport?.code ??
      'BASKETBALL') as SportCode;
    const modality = (row.category?.tournament?.modality ?? '5v5') as Modality;
    const rules = this.sportRules.get(sportCode, modality);

    const validation = validateMatchScore(rules, input.homeScore, input.awayScore);
    if (!validation.ok) {
      throw new BusinessError(
        ErrorCode.MATCH_INVALID_SCORE,
        validation.error ?? 'Marcador inválido',
        HttpStatus.BAD_REQUEST,
        {
          matchId: row.id,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
        },
      );
    }

    const updated = await this.repo.updateRaw(row.id, {
      status: MATCH_STATUS.FINALIZADO,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
    });

    this.events.emit(DomainEvent.MATCH_FINISHED, {
      matchId: updated.id,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      homeTeamId: updated.homeTeamId,
      awayTeamId: updated.awayTeamId,
      countsForStandings: validation.countsForStandings,
      resolution: 'organic',
    } satisfies DomainEventPayloads['match.finished']);

    this.logger.log(
      `Match finished: ${updated.id} — ${input.homeScore}-${input.awayScore} (countsForStandings=${validation.countsForStandings})`,
    );

    return updated;
  }
}
