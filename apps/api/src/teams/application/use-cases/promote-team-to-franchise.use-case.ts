import { Injectable } from '@nestjs/common';
import type { CreateFranchiseSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../../teams.service';

@Injectable()
export class PromoteTeamToFranchiseUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(teamId: string, dto: CreateFranchiseSchemaDto, ownerId: string) {
    return this.legacy.promoteToFranchise(teamId, dto, ownerId);
  }
}
