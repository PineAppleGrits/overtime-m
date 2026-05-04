import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IMatchContextPort,
  MatchSummary,
} from '../../application/ports/match-context.port';

@Injectable()
export class PrismaMatchContextRepository implements IMatchContextPort {
  constructor(private readonly prisma: PrismaService) {}

  async getById(matchId: string): Promise<MatchSummary | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    });
    if (!match) return null;
    return {
      id: match.id,
      costPerTeam: match.costPerTeam ?? null,
      homeTeam: match.homeTeam ?? null,
      awayTeam: match.awayTeam ?? null,
    };
  }
}
