import { Injectable } from '@nestjs/common';
import type { CreateTeamSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../../teams.service';

@Injectable()
export class CreateTeamUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(createTeamDto: CreateTeamSchemaDto, creatorId: string) {
    return this.legacy.create(createTeamDto, creatorId);
  }
}
