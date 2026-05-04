import { Injectable } from '@nestjs/common';
import { StartMatchUseCase } from '../use-cases/start-match.use-case';
import { FinishMatchUseCase } from '../use-cases/finish-match.use-case';
import {
  CancelMatchByTeamUseCase,
  CancelMatchByTeamInput,
  CancelMatchByTeamOutput,
} from '../use-cases/cancel-match-by-team.use-case';
import {
  ResolveRivalDecisionInput,
  ResolveRivalDecisionUseCase,
} from '../use-cases/resolve-rival-decision.use-case';
import {
  RescheduleMatchInput,
  RescheduleMatchUseCase,
} from '../use-cases/reschedule-match.use-case';
import {
  SuspendMatchInput,
  SuspendMatchUseCase,
} from '../use-cases/suspend-match.use-case';
import {
  ResolveSuspendedMatchInput,
  ResolveSuspendedMatchUseCase,
} from '../use-cases/resolve-suspended-match.use-case';
import {
  RecordMutualCancelInput,
  RecordMutualCancelUseCase,
} from '../use-cases/record-mutual-cancel.use-case';
import { MatchRow } from '../ports/match-repository.port';

/**
 * Facade para los nuevos casos de uso de W3.1 (lifecycle avanzado).
 *
 * Los endpoints CRUD básicos (`create`, `findAll`, `update`, `remove`,
 * `changeStatus`, batch, announcements) siguen viviendo en `MatchesService`
 * para no romper compat. Este servicio cubre lo nuevo.
 */
@Injectable()
export class MatchLifecycleService {
  constructor(
    private readonly startUC: StartMatchUseCase,
    private readonly finishUC: FinishMatchUseCase,
    private readonly cancelByTeamUC: CancelMatchByTeamUseCase,
    private readonly resolveRivalUC: ResolveRivalDecisionUseCase,
    private readonly rescheduleUC: RescheduleMatchUseCase,
    private readonly suspendUC: SuspendMatchUseCase,
    private readonly resolveSuspendedUC: ResolveSuspendedMatchUseCase,
    private readonly mutualCancelUC: RecordMutualCancelUseCase,
  ) {}

  start(matchId: string, options?: { allowFiftyPercentDebtRule?: boolean }): Promise<MatchRow> {
    return this.startUC.execute({ matchId, ...options });
  }

  finish(
    matchId: string,
    homeScore: number,
    awayScore: number,
  ): Promise<MatchRow> {
    return this.finishUC.execute({ matchId, homeScore, awayScore });
  }

  cancelByTeam(
    input: CancelMatchByTeamInput,
  ): Promise<CancelMatchByTeamOutput> {
    return this.cancelByTeamUC.execute(input);
  }

  resolveRivalDecision(input: ResolveRivalDecisionInput): Promise<MatchRow> {
    return this.resolveRivalUC.execute(input);
  }

  reschedule(input: RescheduleMatchInput): Promise<MatchRow> {
    return this.rescheduleUC.execute(input);
  }

  suspend(input: SuspendMatchInput): Promise<MatchRow> {
    return this.suspendUC.execute(input);
  }

  resolveSuspended(input: ResolveSuspendedMatchInput): Promise<MatchRow> {
    return this.resolveSuspendedUC.execute(input);
  }

  mutualCancel(input: RecordMutualCancelInput): Promise<MatchRow> {
    return this.mutualCancelUC.execute(input);
  }
}
