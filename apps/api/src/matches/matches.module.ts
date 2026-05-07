import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { DatabaseModule } from '../database/database.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { VenuesModule } from '../venues/venues.module';
import { DebtsModule } from '../debts/debts.module';
import { MatchPlayerStatsService } from './match-player-stats.service';
import { MatchPlayerStatsController } from './match-player-stats.controller';
// W3.1 — clean architecture for lifecycle/playoff-aware use cases
import { MATCH_REPOSITORY } from './application/ports/match-repository.port';
import { DEBTS_CHECK_PORT } from './application/ports/debts-check.port';
import { STAFF_CHECK_PORT } from './application/ports/staff-check.port';
import { PrismaMatchRepository } from './infrastructure/repositories/prisma-match.repository';
import { DebtsCheckAdapter } from './infrastructure/adapters/debts-check.adapter';
import { StaffCheckAdapter } from './infrastructure/adapters/staff-check.adapter';
import { StartMatchUseCase } from './application/use-cases/start-match.use-case';
import { FinishMatchUseCase } from './application/use-cases/finish-match.use-case';
import { CancelMatchByTeamUseCase } from './application/use-cases/cancel-match-by-team.use-case';
import { ResolveRivalDecisionUseCase } from './application/use-cases/resolve-rival-decision.use-case';
import { RescheduleMatchUseCase } from './application/use-cases/reschedule-match.use-case';
import { SuspendMatchUseCase } from './application/use-cases/suspend-match.use-case';
import { ResolveSuspendedMatchUseCase } from './application/use-cases/resolve-suspended-match.use-case';
import { RecordMutualCancelUseCase } from './application/use-cases/record-mutual-cancel.use-case';
import { MatchLifecycleService } from './application/services/match-lifecycle.service';
import { MatchLifecycleController } from './presentation/controllers/match-lifecycle.controller';

/**
 * Matches module — W3.1.
 *
 * Mantiene `MatchesService` y `MatchesController` originales (no se rompen
 * endpoints existentes). Suma una capa de clean architecture para los
 * casos de lifecycle nuevos:
 *  - StartMatch (RN-049, RN-053)
 *  - FinishMatch (sport rules + RN-024)
 *  - CancelMatchByTeam (RN-032 → 72h, decisión rival)
 *  - ResolveRivalDecision (RN-032 → request_points / reschedule)
 *  - RescheduleMatch (RN-052)
 *  - SuspendMatch / ResolveSuspendedMatch (RN-054, RN-055)
 *  - RecordMutualCancel (RN-056)
 *
 * Usa `DebtsService` (W2.1) via adapter para chequear RN-053.
 */
@Module({
  imports: [DatabaseModule, VenuesModule, EligibilityModule, DebtsModule],
  controllers: [
    MatchesController,
    MatchLifecycleController,
    MatchPlayerStatsController,
  ],
  providers: [
    MatchesService,
    MatchLifecycleService,
    MatchPlayerStatsService,
    StartMatchUseCase,
    FinishMatchUseCase,
    CancelMatchByTeamUseCase,
    ResolveRivalDecisionUseCase,
    RescheduleMatchUseCase,
    SuspendMatchUseCase,
    ResolveSuspendedMatchUseCase,
    RecordMutualCancelUseCase,
    { provide: MATCH_REPOSITORY, useClass: PrismaMatchRepository },
    { provide: DEBTS_CHECK_PORT, useClass: DebtsCheckAdapter },
    { provide: STAFF_CHECK_PORT, useClass: StaffCheckAdapter },
  ],
  exports: [MatchesService, MatchLifecycleService, MatchPlayerStatsService],
})
export class MatchesModule {}
