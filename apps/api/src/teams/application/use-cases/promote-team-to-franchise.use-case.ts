import { Injectable } from '@nestjs/common';
import type { CreateFranchiseSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class PromoteTeamToFranchiseUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(teamId: string, dto: CreateFranchiseSchemaDto, ownerId: string) {
    return this.teams.promoteToFranchise(teamId, dto, ownerId);
  }
}
