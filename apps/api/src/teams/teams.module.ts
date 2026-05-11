import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { MatchesModule } from '../matches/matches.module';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TournamentTeamsController } from './tournament-teams.controller';
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
import { TeamsFacadeService } from './application/services/teams-facade.service';

@Module({
  imports: [EligibilityModule, MatchesModule],
  controllers: [TeamsController, TournamentTeamsController],
  providers: [
    TeamsService,
    TeamsFacadeService,
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
  ],
  exports: [TeamsService, TeamsFacadeService],
})
export class TeamsModule {}
