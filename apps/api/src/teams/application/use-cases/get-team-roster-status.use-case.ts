import { Injectable } from '@nestjs/common';
import type { Modality } from '../../../common/sport-rules/sport-rules.types';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class GetTeamRosterStatusUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(teamId: string, modality: Modality) {
    return this.teams.getRosterStatus(teamId, modality);
  }
}
