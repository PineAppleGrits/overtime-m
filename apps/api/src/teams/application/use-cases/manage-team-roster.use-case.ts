import { Injectable } from '@nestjs/common';
import type { AddPlayerSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class ManageTeamRosterUseCase {
  constructor(private readonly teams: TeamsService) {}

  async addPlayer(teamId: string, addPlayerDto: AddPlayerSchemaDto) {
    return this.teams.addPlayer(teamId, addPlayerDto);
  }

  async removePlayer(teamId: string, profileId: string) {
    return this.teams.removePlayer(teamId, profileId);
  }
}
