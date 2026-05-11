import { Injectable } from '@nestjs/common';
import { TeamsService } from '../../teams.service';

@Injectable()
export class GetTeamBalanceUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(teamId: string, currentUserId: string, currentUserRole?: string | null) {
    return this.legacy.getBalance(teamId, currentUserId, currentUserRole);
  }
}
