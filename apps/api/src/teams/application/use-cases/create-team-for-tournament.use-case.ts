import { Injectable } from '@nestjs/common';
import type { CreateTeamSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../../teams.service';

@Injectable()
export class CreateTeamForTournamentUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(tournamentId: string, createTeamDto: CreateTeamSchemaDto, creatorId: string) {
    return this.legacy.createForTournament(tournamentId, createTeamDto, creatorId);
  }
}
