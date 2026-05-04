import { Injectable } from '@nestjs/common';
import { Prisma, PlayoffSeriesStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  IPlayoffRepository,
  PlayoffSeriesRow,
} from '../../application/ports/playoff-repository.port';

const seriesInclude = {
  homeTeam: true,
  awayTeam: true,
  winnerTeam: true,
  matchesDirect: true,
  feedsToA: true,
  feedsToB: true,
} satisfies Prisma.PlayoffSeriesInclude;

@Injectable()
export class PrismaPlayoffRepository implements IPlayoffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSeriesById(id: string): Promise<PlayoffSeriesRow | null> {
    return this.prisma.playoffSeries.findUnique({
      where: { id },
      include: seriesInclude,
    });
  }

  async findSeriesByCategory(
    categoryId: string,
  ): Promise<PlayoffSeriesRow[]> {
    return this.prisma.playoffSeries.findMany({
      where: { categoryId },
      include: seriesInclude,
      orderBy: [{ round: 'asc' }, { bracketPosition: 'asc' }],
    });
  }

  async findSeriesFedByCompletedSeries(
    completedSeriesId: string,
  ): Promise<PlayoffSeriesRow[]> {
    return this.prisma.playoffSeries.findMany({
      where: {
        OR: [
          { feedsFromSeriesAId: completedSeriesId },
          { feedsFromSeriesBId: completedSeriesId },
        ],
      },
      include: seriesInclude,
    });
  }

  async markSeriesCompleted(
    seriesId: string,
    winnerTeamId: string,
  ): Promise<void> {
    await this.prisma.playoffSeries.update({
      where: { id: seriesId },
      data: {
        winnerTeamId,
        status: PlayoffSeriesStatus.COMPLETED,
      },
    });
  }

  async setSeriesStatus(seriesId: string, status: string): Promise<void> {
    await this.prisma.playoffSeries.update({
      where: { id: seriesId },
      data: { status: status as PlayoffSeriesStatus },
    });
  }

  async assignTeams(
    seriesId: string,
    homeTeamId: string | null,
    awayTeamId: string | null,
    status?: string,
  ): Promise<void> {
    await this.prisma.playoffSeries.update({
      where: { id: seriesId },
      data: {
        homeTeamId,
        awayTeamId,
        ...(status ? { status: status as PlayoffSeriesStatus } : {}),
      },
    });
  }

  async hasPlayoffMatchesStarted(categoryId: string): Promise<boolean> {
    const count = await this.prisma.match.count({
      where: {
        categoryId,
        playoffStage: { not: null },
        deletedAt: null,
        status: { in: ['en_curso', 'finalizado', 'finalizado_con_resolucion'] },
      },
    });
    return count > 0;
  }

  async countCompletedRegularMatches(categoryId: string): Promise<{
    finished: number;
    total: number;
  }> {
    const [finished, total] = await Promise.all([
      this.prisma.match.count({
        where: {
          categoryId,
          matchType: 'regular',
          status: 'finalizado',
          deletedAt: null,
        },
      }),
      this.prisma.match.count({
        where: {
          categoryId,
          matchType: 'regular',
          deletedAt: null,
        },
      }),
    ]);
    return { finished, total };
  }

  async createSeriesMatches(input: {
    seriesId: string;
    categoryId: string;
    zoneId: string | null;
    homeTeamId: string;
    awayTeamId: string;
    matchType: string;
    playoffStage: string;
    games: number;
    baseDate: Date;
  }): Promise<void> {
    const data: Prisma.MatchCreateManyInput[] = [];
    for (let g = 1; g <= input.games; g++) {
      // Alterna localía: G1 home, G2 away, G3 home, etc.
      const home = g % 2 === 1 ? input.homeTeamId : input.awayTeamId;
      const away = g % 2 === 1 ? input.awayTeamId : input.homeTeamId;
      const date = new Date(input.baseDate);
      date.setUTCDate(date.getUTCDate() + (g - 1) * 3); // separa cada 3 días
      data.push({
        homeTeamId: home,
        awayTeamId: away,
        categoryId: input.categoryId,
        zoneId: input.zoneId ?? undefined,
        matchDate: date,
        status: 'programado',
        matchType: input.matchType,
        seriesId: input.seriesId,
        seriesGameNumber: g,
        playoffStage: input.playoffStage as never,
      });
    }
    await this.prisma.match.createMany({ data });
  }

  async deleteSeriesMatches(seriesId: string): Promise<void> {
    await this.prisma.match.updateMany({
      where: { seriesId, status: 'programado' },
      data: { deletedAt: new Date() },
    });
  }
}
