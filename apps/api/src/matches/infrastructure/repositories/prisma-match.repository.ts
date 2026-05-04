import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  IMatchRepository,
  MatchRow,
} from '../../application/ports/match-repository.port';

const matchInclude = {
  homeTeam: true,
  awayTeam: true,
  category: { include: { tournament: true } },
  zone: true,
  venue: true,
  series: true,
} satisfies Prisma.MatchInclude;

const matchIncludeWithSport = {
  homeTeam: true,
  awayTeam: true,
  category: {
    include: {
      tournament: { include: { sport: true } },
    },
  },
  zone: true,
  venue: true,
  series: true,
} satisfies Prisma.MatchInclude;

@Injectable()
export class PrismaMatchRepository implements IMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MatchRow | null> {
    const row = await this.prisma.match.findUnique({
      where: { id, deletedAt: null },
      include: matchInclude,
    });
    return row as unknown as MatchRow | null;
  }

  async findByIdWithSport(
    id: string,
  ): Promise<
    | (MatchRow & {
        category:
          | (NonNullable<MatchRow['category']> & {
              tournament: NonNullable<MatchRow['category']>['tournament'] & {
                sport: { code: string };
              };
            })
          | null;
      })
    | null
  > {
    const row = await this.prisma.match.findUnique({
      where: { id, deletedAt: null },
      include: matchIncludeWithSport,
    });
    return row as unknown as
      | (MatchRow & {
          category:
            | (NonNullable<MatchRow['category']> & {
                tournament: NonNullable<MatchRow['category']>['tournament'] & {
                  sport: { code: string };
                };
              })
            | null;
        })
      | null;
  }

  async updateRaw(
    id: string,
    data: Prisma.MatchUpdateInput,
  ): Promise<MatchRow> {
    const row = await this.prisma.match.update({
      where: { id },
      data,
      include: matchInclude,
    });
    return row as unknown as MatchRow;
  }

  async countConfirmedStaff(matchId: string): Promise<{
    referees: number;
    tableOfficials: number;
  }> {
    const grouped = await this.prisma.matchStaff.groupBy({
      by: ['role'],
      where: {
        matchId,
        status: 'assigned',
      },
      _count: { _all: true },
    });

    const counts = { referees: 0, tableOfficials: 0 };
    for (const row of grouped) {
      if (row.role === 'referee') counts.referees = row._count._all;
      else if (row.role === 'table_official')
        counts.tableOfficials = row._count._all;
    }
    return counts;
  }

  async findBySeriesId(seriesId: string): Promise<MatchRow[]> {
    const rows = await this.prisma.match.findMany({
      where: { seriesId, deletedAt: null },
      include: matchInclude,
      orderBy: { seriesGameNumber: 'asc' },
    });
    return rows as unknown as MatchRow[];
  }
}
