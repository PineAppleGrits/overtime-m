import { Injectable } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class AssignTeamCaptainUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(teamId: string, profileId: string) {
    return this.teams.assignCaptain(teamId, profileId);
  }
}
