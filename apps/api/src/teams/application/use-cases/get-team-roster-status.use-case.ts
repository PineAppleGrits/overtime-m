import { Injectable } from '@nestjs/common';
import type { Modality } from '../../../common/sport-rules/sport-rules.types';
import { TeamsService } from '../../teams.service';

@Injectable()
export class GetTeamRosterStatusUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(teamId: string, modality: Modality) {
    return this.legacy.getRosterStatus(teamId, modality);
  }
}
