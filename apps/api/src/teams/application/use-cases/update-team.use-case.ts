import { Injectable } from '@nestjs/common';
import type { UpdateTeamSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class UpdateTeamUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(id: string, updateTeamDto: UpdateTeamSchemaDto) {
    return this.teams.update(id, updateTeamDto);
  }
}
