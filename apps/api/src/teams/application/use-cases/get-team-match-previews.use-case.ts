import { Injectable } from '@nestjs/common';
import { TeamsService } from '../../teams.service';

@Injectable()
export class GetTeamMatchPreviewsUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(teamId: string, type?: 'last' | 'next') {
    return this.legacy.findTeamMatches(teamId, type);
  }
}
