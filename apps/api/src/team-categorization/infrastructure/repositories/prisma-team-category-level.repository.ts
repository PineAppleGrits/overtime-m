import { Injectable } from '@nestjs/common';
import { TeamCategoryLevel as PrismaTeamCategoryLevel } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { TeamCategoryLevel } from '../../domain/entities/team-category-level.entity';
import {
  AssignTeamLevelInput,
  ITeamCategoryLevelRepository,
} from '../../application/ports/team-category-level.repository';

@Injectable()
export class PrismaTeamCategoryLevelRepository
  implements ITeamCategoryLevelRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaTeamCategoryLevel): TeamCategoryLevel {
    return new TeamCategoryLevel(
      row.id,
      row.teamId,
      row.categoryLevelId,
      row.grantedByProfileId,
      row.grantedAt,
      row.notes,
    );
  }

  async listByTeam(teamId: string): Promise<TeamCategoryLevel[]> {
    const rows = await this.prisma.teamCategoryLevel.findMany({
      where: { teamId },
      orderBy: { grantedAt: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async replaceForTeam(
    teamId: string,
    inputs: AssignTeamLevelInput[],
  ): Promise<TeamCategoryLevel[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.teamCategoryLevel.deleteMany({ where: { teamId } });
      const created = await Promise.all(
        inputs.map((input) =>
          tx.teamCategoryLevel.create({
            data: {
              teamId: input.teamId,
              categoryLevelId: input.categoryLevelId,
              grantedByProfileId: input.grantedByProfileId,
              notes: input.notes ?? null,
            },
          }),
        ),
      );
      return created.map((r) => this.toDomain(r));
    });
  }

  async addForTeam(
    inputs: AssignTeamLevelInput[],
  ): Promise<TeamCategoryLevel[]> {
    if (inputs.length === 0) return [];
    return this.prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        inputs.map((input) =>
          tx.teamCategoryLevel.create({
            data: {
              teamId: input.teamId,
              categoryLevelId: input.categoryLevelId,
              grantedByProfileId: input.grantedByProfileId,
              notes: input.notes ?? null,
            },
          }),
        ),
      );
      return created.map((r) => this.toDomain(r));
    });
  }

  async removeForTeam(
    teamId: string,
    teamCategoryLevelId: string,
  ): Promise<boolean> {
    const result = await this.prisma.teamCategoryLevel.deleteMany({
      where: { id: teamCategoryLevelId, teamId },
    });
    return result.count > 0;
  }

  async hasLevel(teamId: string, categoryLevelId: string): Promise<boolean> {
    const found = await this.prisma.teamCategoryLevel.findUnique({
      where: { teamId_categoryLevelId: { teamId, categoryLevelId } },
      select: { id: true },
    });
    return Boolean(found);
  }

  async listPendingCategorization(minObserved: number): Promise<
    Array<{
      teamId: string;
      teamName: string;
      observedFriendlies: number;
    }>
  > {
    // Equipos sin niveles asignados que aparecen en N+ amistosos observados.
    // Se computa sumando home + away — un mismo amistoso suma para ambos.
    const observedFriendlies = await this.prisma.friendly.findMany({
      where: {
        observedForCategorization: true,
        deletedAt: null,
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
      },
    });

    const counts = new Map<string, number>();
    for (const f of observedFriendlies) {
      counts.set(f.homeTeamId, (counts.get(f.homeTeamId) ?? 0) + 1);
      counts.set(f.awayTeamId, (counts.get(f.awayTeamId) ?? 0) + 1);
    }

    const candidateIds = Array.from(counts.entries())
      .filter(([, count]) => count >= minObserved)
      .map(([teamId]) => teamId);

    if (candidateIds.length === 0) return [];

    const teams = await this.prisma.team.findMany({
      where: {
        id: { in: candidateIds },
        deletedAt: null,
        // Sin niveles asignados todavía
        categoryLevels: { none: {} },
      },
      select: { id: true, name: true },
    });

    return teams
      .map((t) => ({
        teamId: t.id,
        teamName: t.name,
        observedFriendlies: counts.get(t.id) ?? 0,
      }))
      .sort((a, b) => b.observedFriendlies - a.observedFriendlies);
  }
}
