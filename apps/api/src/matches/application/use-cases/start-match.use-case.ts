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
import { Match } from '../../domain/entities/match.entity';
import {
  MATCH_STATUS,
  canTransitionMatchStatus,
} from '../../domain/rules/transitions.rules';
import { checkMinStaff } from '../../domain/rules/eligibility-checks.rules';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
  MatchRow,
} from '../ports/match-repository.port';
import {
  DEBTS_CHECK_PORT,
  IDebtsCheckPort,
} from '../ports/debts-check.port';
import {
  IStaffCheckPort,
  STAFF_CHECK_PORT,
} from '../ports/staff-check.port';

export interface StartMatchInput {
  matchId: string;
  /** Permite forzar la regla del 50% (DP-006) si W3.1 lo decide. Default false. */
  allowFiftyPercentDebtRule?: boolean;
}

/**
 * `start` — transiciona PROGRAMADO → EN_CURSO con validaciones:
 *   - Transición permitida.
 *   - Staff mínimo (RN-049).
 *   - Equipos sin deudas pendientes (RN-053).
 */
@Injectable()
export class StartMatchUseCase {
  private readonly logger = new Logger(StartMatchUseCase.name);

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    @Inject(DEBTS_CHECK_PORT) private readonly debts: IDebtsCheckPort,
    @Inject(STAFF_CHECK_PORT) private readonly staff: IStaffCheckPort,
    private readonly sportRules: SportRulesRegistry,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: StartMatchInput): Promise<MatchRow> {
    const row = await this.repo.findByIdWithSport(input.matchId);
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

    if (!match.canStart()) {
      throw new BusinessError(
        ErrorCode.MATCH_INVALID_STATUS_TRANSITION,
        `No se puede iniciar un partido en estado "${match.status}". Debe estar "programado".`,
        HttpStatus.CONFLICT,
        { matchId: input.matchId, currentStatus: match.status },
      );
    }

    // RN-049 — staff mínimo
    const sportCode = (row.category?.tournament?.sport?.code ??
      'BASKETBALL') as SportCode;
    const modality = (row.category?.tournament?.modality ?? '5v5') as Modality;
    const rules = this.sportRules.get(sportCode, modality);

    const staffCounts = await this.staff.countConfirmedStaff(match.id);
    const staffError = checkMinStaff(rules, staffCounts);
    if (staffError) {
      throw new BusinessError(
        ErrorCode.MATCH_STAFF_BELOW_MIN,
        staffError,
        HttpStatus.CONFLICT,
        {
          matchId: match.id,
          required: {
            referees: rules.staff.minReferees,
            tableOfficials: rules.staff.minTableOfficials,
          },
          actual: staffCounts,
        },
      );
    }

    // RN-053 — deudas pendientes en cualquiera de los dos equipos
    const teamsToCheck = [match.homeTeamId, match.awayTeamId].filter(
      (id): id is string => Boolean(id),
    );
    for (const teamId of teamsToCheck) {
      const hasDebt = await this.debts.hasOutstandingDebts(teamId, {
        allowFiftyPercentRule: input.allowFiftyPercentDebtRule ?? false,
      });
      if (hasDebt) {
        throw new BusinessError(
          ErrorCode.MATCH_TEAM_HAS_OUTSTANDING_DEBT,
          'Uno de los equipos tiene deudas pendientes y no puede disputar el partido (RN-053).',
          HttpStatus.CONFLICT,
          { matchId: match.id, teamId },
        );
      }
    }

    const updated = await this.repo.updateRaw(match.id, {
      status: MATCH_STATUS.EN_CURSO,
    });

    this.events.emit(DomainEvent.MATCH_STARTED, {
      matchId: updated.id,
    } satisfies DomainEventPayloads['match.started']);

    this.logger.log(`Match started: ${updated.id}`);
    return updated;
  }
}

// Util consumida por otros use-cases (mantener cohesión sin dep circular).
export function assertCanTransition(
  from: string,
  to: import('../../domain/rules/transitions.rules').MatchStatusValue,
): void {
  if (!canTransitionMatchStatus(from, to)) {
    throw new BusinessError(
      ErrorCode.MATCH_INVALID_STATUS_TRANSITION,
      `Transición de estado inválida: ${from} → ${to}.`,
      HttpStatus.CONFLICT,
      { from, to },
    );
  }
}
