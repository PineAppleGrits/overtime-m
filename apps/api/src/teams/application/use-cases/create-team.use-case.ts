import { Injectable } from '@nestjs/common';
import type { CreateTeamSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class CreateTeamUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(createTeamDto: CreateTeamSchemaDto, creatorId: string) {
    return this.teams.create(createTeamDto, creatorId);
  }
}
