import { Injectable } from '@nestjs/common';
import type { AddPlayerSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../../teams.service';

@Injectable()
export class ManageTeamRosterUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async addPlayer(teamId: string, addPlayerDto: AddPlayerSchemaDto) {
    return this.legacy.addPlayer(teamId, addPlayerDto);
  }

  async removePlayer(teamId: string, profileId: string) {
    return this.legacy.removePlayer(teamId, profileId);
  }
}
