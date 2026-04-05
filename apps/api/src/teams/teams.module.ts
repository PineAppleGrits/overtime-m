import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TournamentTeamsController } from './tournament-teams.controller';

@Module({
  controllers: [TeamsController, TournamentTeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
