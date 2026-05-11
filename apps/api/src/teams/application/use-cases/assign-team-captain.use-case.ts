import { Injectable } from '@nestjs/common';
import { TeamsService } from '../../teams.service';

@Injectable()
export class AssignTeamCaptainUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(teamId: string, profileId: string) {
    return this.legacy.assignCaptain(teamId, profileId);
  }
}
