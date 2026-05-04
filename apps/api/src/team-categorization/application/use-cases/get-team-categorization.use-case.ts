import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TeamCategorizationDto } from '@overtime-mono/shared';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { PrismaService } from '../../../database/prisma.service';
import {
  CATEGORY_LEVEL_REPOSITORY,
  ICategoryLevelRepository,
} from '../../../category-levels/application/ports/category-level.repository';
import { sortByRankAsc } from '../../../category-levels/domain/rules/category-level.rules';
import { isTeamCategorized } from '../../domain/rules/team-categorization.rules';
import {
  ITeamCategoryLevelRepository,
  TEAM_CATEGORY_LEVEL_REPOSITORY,
} from '../ports/team-category-level.repository';

@Injectable()
export class GetTeamCategorizationUseCase {
  constructor(
    @Inject(TEAM_CATEGORY_LEVEL_REPOSITORY)
    private readonly teamLevelsRepo: ITeamCategoryLevelRepository,
    @Inject(CATEGORY_LEVEL_REPOSITORY)
    private readonly categoryLevelsRepo: ICategoryLevelRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(teamId: string): Promise<TeamCategorizationDto> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true },
    });
    if (!team) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Equipo no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const assignments = await this.teamLevelsRepo.listByTeam(teamId);
    const levels = await Promise.all(
      assignments.map((a) => this.categoryLevelsRepo.findById(a.categoryLevelId)),
    );

    const sorted = sortByRankAsc(levels.filter((l): l is NonNullable<typeof l> => l !== null));

    const observedFriendlies = await this.prisma.friendly.count({
      where: {
        observedForCategorization: true,
        deletedAt: null,
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
    });

    return {
      teamId,
      levels: sorted.map((l) => ({
        id: l.id,
        sportId: l.sportId,
        code: l.code.value,
        displayName: l.displayName,
        rank: l.rank,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      observedFriendlies,
      isCategorized: isTeamCategorized(sorted.length),
    };
  }
}
