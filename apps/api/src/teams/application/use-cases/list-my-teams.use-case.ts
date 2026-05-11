import { Injectable } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class ListMyTeamsUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(profileId: string) {
    return this.teams.findMine(profileId);
  }
}
