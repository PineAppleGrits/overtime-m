import { Injectable } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class GetTeamUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(id: string) {
    return this.teams.findOne(id);
  }
}
