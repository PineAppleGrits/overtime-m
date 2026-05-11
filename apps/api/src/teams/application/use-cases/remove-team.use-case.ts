import { Injectable } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class RemoveTeamUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(id: string) {
    return this.teams.remove(id);
  }
}
