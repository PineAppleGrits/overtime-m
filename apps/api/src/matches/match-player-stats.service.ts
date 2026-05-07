import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Una entrada del payload de upsert de stats. `profileId` y `teamId` son
 * obligatorios; el resto es opcional con default 0. `points` se computa en el
 * server como `pt1 + 2*pt2 + 3*pt3` para evitar discrepancias.
 */
export interface MatchPlayerStatInput {
  profileId: string;
  teamId: string;
  pt1?: number;
  pt1Att?: number;
  pt2?: number;
  pt2Att?: number;
  pt3?: number;
  pt3Att?: number;
  fouls?: number;
  steals?: number;
  rebounds?: number;
  assists?: number;
  turnovers?: number;
  blocks?: number;
}

export interface PlayerStatRow {
  profileId: string;
  profileName: string;
  profileAvatarUrl: string | null;
  teamId: string;
  played: number;
  points: number;
  pt1: number;
  pt2: number;
  pt3: number;
  fouls: number;
  steals: number;
  rebounds: number;
  assists: number;
}

const intOrZero = (v: number | undefined | null): number =>
  Number.isFinite(v) ? Math.max(0, Math.trunc(v as number)) : 0;

/**
 * BE-MOCK-005 — gestión de stats individuales por partido.
 *
 * Diseño deliberadamente simple: un service con 4 métodos públicos. No usamos
 * clean arch porque no hay reglas de dominio complejas — son CRUD + agregaciones.
 */
@Injectable()
export class MatchPlayerStatsService {
  private readonly logger = new Logger(MatchPlayerStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Lista las stats de un partido (un row por jugador con stats cargados). */
  async listByMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: { id: true },
    });
    if (!match) throw new NotFoundException('Match not found');

    const rows = await this.prisma.matchPlayerStat.findMany({
      where: { matchId },
      include: {
        profile: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      profileId: r.profileId,
      profileName: r.profile.name,
      profileAvatarUrl: r.profile.avatarUrl,
      teamId: r.teamId,
      pt1: r.pt1,
      pt1Att: r.pt1Att,
      pt2: r.pt2,
      pt2Att: r.pt2Att,
      pt3: r.pt3,
      pt3Att: r.pt3Att,
      fouls: r.fouls,
      steals: r.steals,
      rebounds: r.rebounds,
      assists: r.assists,
      turnovers: r.turnovers,
      blocks: r.blocks,
      points: r.points,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Bulk upsert: cada `(matchId, profileId)` en el payload se inserta o
   * actualiza atómicamente. Las stats que no aparezcan en el payload no se
   * tocan — para borrar hay que enviar la entrada con todos los counts en 0
   * (TODO si pinta endpoint DELETE explícito).
   */
  async upsertForMatch(
    matchId: string,
    inputs: MatchPlayerStatInput[],
    createdByProfileId: string,
  ) {
    if (!inputs.length) {
      throw new BadRequestException('Empty stats payload');
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: { id: true, homeTeamId: true, awayTeamId: true },
    });
    if (!match) throw new NotFoundException('Match not found');

    const allowedTeamIds = new Set(
      [match.homeTeamId, match.awayTeamId].filter(
        (id): id is string => id !== null,
      ),
    );
    if (!allowedTeamIds.size) {
      throw new BadRequestException(
        'Match has no teams assigned — cannot upsert player stats',
      );
    }

    // Validamos que cada teamId pertenezca al partido.
    for (const input of inputs) {
      if (!allowedTeamIds.has(input.teamId)) {
        throw new BadRequestException(
          `teamId ${input.teamId} is not part of this match`,
        );
      }
    }

    // Verificamos duplicados de profileId en el payload.
    const seenProfiles = new Set<string>();
    for (const input of inputs) {
      if (seenProfiles.has(input.profileId)) {
        throw new BadRequestException(
          `Duplicate profileId ${input.profileId} in payload`,
        );
      }
      seenProfiles.add(input.profileId);
    }

    const now = new Date();

    const operations = inputs.map((input) => {
      const pt1 = intOrZero(input.pt1);
      const pt2 = intOrZero(input.pt2);
      const pt3 = intOrZero(input.pt3);
      const points = pt1 + 2 * pt2 + 3 * pt3;
      const data = {
        teamId: input.teamId,
        pt1,
        pt1Att: intOrZero(input.pt1Att),
        pt2,
        pt2Att: intOrZero(input.pt2Att),
        pt3,
        pt3Att: intOrZero(input.pt3Att),
        fouls: intOrZero(input.fouls),
        steals: intOrZero(input.steals),
        rebounds: intOrZero(input.rebounds),
        assists: intOrZero(input.assists),
        turnovers: intOrZero(input.turnovers),
        blocks: intOrZero(input.blocks),
        points,
        updatedAt: now,
      };

      return this.prisma.matchPlayerStat.upsert({
        where: {
          matchId_profileId: {
            matchId,
            profileId: input.profileId,
          },
        },
        create: {
          matchId,
          profileId: input.profileId,
          createdByProfileId,
          ...data,
        },
        update: data,
      });
    });

    const rows = await this.prisma.$transaction(operations);
    this.logger.log(
      `Upserted ${rows.length} player stats for match ${matchId}`,
    );
    return rows;
  }

  /**
   * Stats agregadas a nivel team. NO depende de `MatchPlayerStat` — se
   * derivan de `Match.homeScore/awayScore` directamente.
   */
  async aggregateTeamTotals(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    const matches = await this.prisma.match.findMany({
      where: {
        deletedAt: null,
        status: 'finalizado',
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });

    let won = 0;
    let lost = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const m of matches) {
      const isHome = m.homeTeamId === teamId;
      const own = isHome ? m.homeScore : m.awayScore;
      const opp = isHome ? m.awayScore : m.homeScore;
      pointsFor += own;
      pointsAgainst += opp;
      if (own > opp) won += 1;
      else if (own < opp) lost += 1;
    }

    return {
      playedMatches: matches.length,
      won,
      lost,
      pointsFor,
      pointsAgainst,
    };
  }

  /**
   * Stats agregadas por jugador del team — suma todos los `MatchPlayerStat`
   * del jugador donde `teamId = X`.
   */
  async aggregatePlayerTotalsByTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    const grouped = await this.prisma.matchPlayerStat.groupBy({
      by: ['profileId'],
      where: { teamId },
      _count: { matchId: true },
      _sum: {
        points: true,
        pt1: true,
        pt2: true,
        pt3: true,
        fouls: true,
        steals: true,
        rebounds: true,
        assists: true,
      },
    });

    if (!grouped.length) return [];

    const profileIds = grouped.map((g) => g.profileId);
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true, name: true, avatarUrl: true },
    });
    const byId = new Map(profiles.map((p) => [p.id, p]));

    const rows: PlayerStatRow[] = grouped.map((g) => {
      const profile = byId.get(g.profileId);
      return {
        profileId: g.profileId,
        profileName: profile?.name ?? '',
        profileAvatarUrl: profile?.avatarUrl ?? null,
        teamId,
        played: g._count.matchId,
        points: g._sum.points ?? 0,
        pt1: g._sum.pt1 ?? 0,
        pt2: g._sum.pt2 ?? 0,
        pt3: g._sum.pt3 ?? 0,
        fouls: g._sum.fouls ?? 0,
        steals: g._sum.steals ?? 0,
        rebounds: g._sum.rebounds ?? 0,
        assists: g._sum.assists ?? 0,
      };
    });

    return rows.sort((a, b) => b.points - a.points);
  }
}
