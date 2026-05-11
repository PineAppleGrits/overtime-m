import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { MatchesModule } from '../matches/matches.module';
import { TEAM_ELIGIBILITY_PORT } from './application/ports/team-eligibility.port';
import { TEAM_MEDIA_PORT } from './application/ports/team-media.port';
import { TEAM_REPOSITORY } from './application/ports/team-repository.port';
import { TEAM_SPORT_RULES_PORT } from './application/ports/team-sport-rules.port';
import { TEAM_TOURNAMENT_CONTEXT_PORT } from './application/ports/team-tournament-context.port';
import { TeamsService } from './application/services/teams.service';
import { AssignTeamCaptainUseCase } from './application/use-cases/assign-team-captain.use-case';
import { CreateTeamForTournamentUseCase } from './application/use-cases/create-team-for-tournament.use-case';
import { CreateTeamUseCase } from './application/use-cases/create-team.use-case';
import { GetTeamBalanceUseCase } from './application/use-cases/get-team-balance.use-case';
import { GetTeamMatchPreviewsUseCase } from './application/use-cases/get-team-match-previews.use-case';
import { GetTeamRosterStatusUseCase } from './application/use-cases/get-team-roster-status.use-case';
import { GetTeamUseCase } from './application/use-cases/get-team.use-case';
import { ListMyTeamsUseCase } from './application/use-cases/list-my-teams.use-case';
import { ListTeamsUseCase } from './application/use-cases/list-teams.use-case';
import { ManageTeamRosterUseCase } from './application/use-cases/manage-team-roster.use-case';
import { PromoteTeamToFranchiseUseCase } from './application/use-cases/promote-team-to-franchise.use-case';
import { RemoveTeamUseCase } from './application/use-cases/remove-team.use-case';
import { UpdateTeamUseCase } from './application/use-cases/update-team.use-case';
import { UploadTeamLogoUseCase } from './application/use-cases/upload-team-logo.use-case';
import { TeamsController } from './presentation/controllers/teams.controller';
import { TournamentTeamsController } from './presentation/controllers/tournament-teams.controller';
import { TeamEligibilityAdapter } from './infrastructure/adapters/eligibility.adapter';
import { TeamMediaAdapter } from './infrastructure/adapters/media.adapter';
import { TeamSportRulesAdapter } from './infrastructure/adapters/sport-rules.adapter';
import { PrismaTeamRepository } from './infrastructure/repositories/prisma-team.repository';
import { PrismaTeamTournamentContextRepository } from './infrastructure/repositories/prisma-team-tournament-context.repository';

@Module({
  imports: [EligibilityModule, MatchesModule],
  controllers: [TeamsController, TournamentTeamsController],
  providers: [
    TeamsService,
    CreateTeamUseCase,
    CreateTeamForTournamentUseCase,
    ListMyTeamsUseCase,
    ListTeamsUseCase,
    GetTeamUseCase,
    UpdateTeamUseCase,
    RemoveTeamUseCase,
    ManageTeamRosterUseCase,
    AssignTeamCaptainUseCase,
    PromoteTeamToFranchiseUseCase,
    GetTeamRosterStatusUseCase,
    UploadTeamLogoUseCase,
    GetTeamMatchPreviewsUseCase,
    GetTeamBalanceUseCase,
    { provide: TEAM_REPOSITORY, useClass: PrismaTeamRepository },
    {
      provide: TEAM_TOURNAMENT_CONTEXT_PORT,
      useClass: PrismaTeamTournamentContextRepository,
    },
    { provide: TEAM_ELIGIBILITY_PORT, useClass: TeamEligibilityAdapter },
    { provide: TEAM_MEDIA_PORT, useClass: TeamMediaAdapter },
    { provide: TEAM_SPORT_RULES_PORT, useClass: TeamSportRulesAdapter },
  ],
})
export class TeamsModule {}
