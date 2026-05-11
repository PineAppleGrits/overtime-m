import { Injectable } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class GetTeamMatchPreviewsUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(teamId: string, type?: 'last' | 'next') {
    return this.teams.findTeamMatches(teamId, type);
  }
}
