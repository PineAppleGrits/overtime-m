import { Injectable } from '@nestjs/common';
import type { UpdateTeamSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../../teams.service';

@Injectable()
export class UpdateTeamUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(id: string, updateTeamDto: UpdateTeamSchemaDto) {
    return this.legacy.update(id, updateTeamDto);
  }
}
