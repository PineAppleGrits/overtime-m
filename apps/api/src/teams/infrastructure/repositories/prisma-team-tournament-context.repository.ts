import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { TeamTournamentContextPort } from '../../application/ports/team-tournament-context.port';

@Injectable()
export class PrismaTeamTournamentContextRepository
  implements TeamTournamentContextPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findTournamentForOperations(tournamentId: string) {
    return this.prisma.tournament.findUnique({
      where: { id: tournamentId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sportId: true,
        teamOperationsOpenAt: true,
        teamOperationsCloseAt: true,
      },
    });
  }
}

