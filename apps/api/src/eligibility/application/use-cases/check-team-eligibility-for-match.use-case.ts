import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  EligibilityCheckResult,
  EligibilityReason,
} from '../../domain/entities/eligibility-check-result.entity';
import { filterBlockingSanctions } from '../../domain/rules/active-suspension.rules';
import {
  ELIGIBILITY_REPOSITORY,
  IEligibilityRepository,
} from '../ports/eligibility-repository.port';
import {
  ELIGIBILITY_SANCTIONS_PORT,
  IEligibilitySanctionsPort,
} from '../ports/sanctions-port.port';
import {
  DEBTS_ELIGIBILITY_PORT,
  IDebtsEligibilityPort,
} from '../ports/debts-port.port';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';

export interface CheckTeamEligibilityForMatchInput {
  teamId: string;
  matchId: string;
  asOfDate?: Date;
  /** RN-053 — DP-006 — habilitar regla del 50%. Default false. */
  allowFiftyPercentRule?: boolean;
}

/**
 * Consolida los checks de un equipo para un partido:
 * - RN-053: sin deudas pendientes que bloqueen.
 * - Sin sanciones activas (de equipo) en scope.
 * - Roster activo >= minPlayersToStart de las SportRules.
 */
@Injectable()
export class CheckTeamEligibilityForMatchUseCase {
  constructor(
    @Inject(ELIGIBILITY_REPOSITORY)
    private readonly repo: IEligibilityRepository,
    @Inject(ELIGIBILITY_SANCTIONS_PORT)
    private readonly sanctionsPort: IEligibilitySanctionsPort,
    @Inject(DEBTS_ELIGIBILITY_PORT)
    private readonly debtsPort: IDebtsEligibilityPort,
    private readonly sportRules: SportRulesRegistry,
  ) {}

  async execute(
    input: CheckTeamEligibilityForMatchInput,
  ): Promise<EligibilityCheckResult> {
    const exists = await this.repo.teamExists(input.teamId);
    if (!exists) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Equipo ${input.teamId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { teamId: input.teamId },
      );
    }

    const matchScope = await this.repo.getMatchScope(input.matchId);
    if (!matchScope) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Partido ${input.matchId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { matchId: input.matchId },
      );
    }

    const asOfDate = input.asOfDate ?? new Date();
    const reasons: EligibilityReason[] = [];

    // RN-053
    const hasDebts = await this.debtsPort.hasOutstandingDebts(input.teamId, {
      allowFiftyPercentRule: input.allowFiftyPercentRule ?? false,
    });
    if (hasDebts) {
      reasons.push({
        code: ErrorCode.MATCH_TEAM_HAS_OUTSTANDING_DEBT,
        message: 'El equipo tiene deudas pendientes que bloquean el partido',
        sourceId: input.teamId,
        type: 'DEBT',
      });
    }

    // Sanciones activas
    const sanctions = await this.sanctionsPort.findActiveSanctionsForTeam(
      input.teamId,
    );
    const blocking = filterBlockingSanctions(
      sanctions,
      {
        matchId: input.matchId,
        categoryId: matchScope.categoryId ?? undefined,
        tournamentId: matchScope.tournamentId ?? undefined,
      },
      asOfDate,
    );
    for (const sanction of blocking) {
      reasons.push({
        code: ErrorCode.PROFILE_SUSPENDED,
        message: 'El equipo tiene una sanción activa',
        sourceId: sanction.id,
        type: 'SANCTION',
      });
    }

    // Min jugadores roster (sport rules)
    const sportContext = await this.repo.getMatchSportContext(input.matchId);
    if (sportContext) {
      try {
        const rules = this.sportRules.tryGet(
          sportContext.sportCode as 'BASKETBALL',
          sportContext.modality as '5v5' | '3v3',
        );
        if (!rules) throw new Error('sport rules not found');
        const min = rules.roster.minPlayersToStart;
        const rosterCount = await this.repo.countActiveRoster(input.teamId);
        if (rosterCount < min) {
          reasons.push({
            code: ErrorCode.MATCH_PLAYERS_BELOW_MIN,
            message: `El equipo tiene ${rosterCount} jugadores activos; se requieren al menos ${min}`,
            type: 'ROSTER_MIN',
          });
        }
      } catch {
        // Si las sport-rules no se pueden resolver, no bloqueamos por roster.
        // (caso defensivo, no debería pasar; loggeo a futuro)
      }
    }

    return EligibilityCheckResult.fromReasons(reasons);
  }
}
