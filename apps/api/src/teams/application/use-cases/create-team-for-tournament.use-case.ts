import { Injectable } from '@nestjs/common';
import type { CreateTeamSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class CreateTeamForTournamentUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(tournamentId: string, createTeamDto: CreateTeamSchemaDto, creatorId: string) {
    return this.teams.createForTournament(tournamentId, createTeamDto, creatorId);
  }
}
