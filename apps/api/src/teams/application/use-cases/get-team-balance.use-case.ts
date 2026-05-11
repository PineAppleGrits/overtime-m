import { Injectable } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class GetTeamBalanceUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(teamId: string, currentUserId: string, currentUserRole?: string | null) {
    return this.teams.getBalance(teamId, currentUserId, currentUserRole);
  }
}
