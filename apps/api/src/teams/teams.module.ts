import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TournamentTeamsController } from './tournament-teams.controller';

@Module({
  imports: [EligibilityModule],
  controllers: [TeamsController, TournamentTeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
