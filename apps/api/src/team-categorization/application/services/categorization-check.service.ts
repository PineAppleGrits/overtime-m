import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { PrismaService } from '../../../database/prisma.service';
import {
  isTeamCategorized,
  isTeamEligibleForCategory,
} from '../../domain/rules/team-categorization.rules';
import {
  CategorizationCheckResult,
  ICategorizationCheckPort,
} from '../ports/categorization-check.port';
import {
  ITeamCategoryLevelRepository,
  TEAM_CATEGORY_LEVEL_REPOSITORY,
} from '../ports/team-category-level.repository';

/**
 * Implementación de `ICategorizationCheckPort`. Combina:
 * - `TeamCategoryLevelRepository` (niveles del equipo).
 * - `Category.categoryLevelId` desde Prisma (nivel objetivo).
 *
 * RN-039: si no hay niveles asignados al equipo → no puede inscribirse.
 * RN-044: si la categoría tiene nivel objetivo y el equipo no lo posee → bloqueo.
 */
@Injectable()
export class CategorizationCheckService implements ICategorizationCheckPort {
  constructor(
    @Inject(TEAM_CATEGORY_LEVEL_REPOSITORY)
    private readonly teamLevelsRepo: ITeamCategoryLevelRepository,
    private readonly prisma: PrismaService,
  ) {}

  async check(
    teamId: string,
    categoryId: string,
  ): Promise<CategorizationCheckResult> {
    const [teamLevels, category] = await Promise.all([
      this.teamLevelsRepo.listByTeam(teamId),
      this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, categoryLevelId: true },
      }),
    ]);

    if (!category) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Categoría no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    const teamLevelIds = teamLevels.map((l) => l.categoryLevelId);

    if (!isTeamCategorized(teamLevelIds.length)) {
      return {
        canRegister: false,
        reason: 'TEAM_NOT_CATEGORIZED',
        teamLevelIds,
        targetCategoryLevelId: category.categoryLevelId,
      };
    }

    if (
      !isTeamEligibleForCategory(teamLevelIds, category.categoryLevelId)
    ) {
      return {
        canRegister: false,
        reason: 'TEAM_NOT_ELIGIBLE_FOR_CATEGORY',
        teamLevelIds,
        targetCategoryLevelId: category.categoryLevelId,
      };
    }

    return {
      canRegister: true,
      teamLevelIds,
      targetCategoryLevelId: category.categoryLevelId,
    };
  }

  async assertCanRegisterToCategory(
    teamId: string,
    categoryId: string,
  ): Promise<void> {
    const result = await this.check(teamId, categoryId);
    if (result.canRegister) return;

    if (result.reason === 'TEAM_NOT_CATEGORIZED') {
      throw new BusinessError(
        ErrorCode.TEAM_NOT_CATEGORIZED,
        'El equipo aún no fue categorizado por la organización (RN-039)',
        HttpStatus.FORBIDDEN,
        { teamId, categoryId },
      );
    }
    throw new BusinessError(
      ErrorCode.TEAM_NOT_ELIGIBLE_FOR_CATEGORY,
      'El equipo no es elegible para esta categoría según su nivel asignado (RN-044)',
      HttpStatus.FORBIDDEN,
      {
        teamId,
        categoryId,
        teamLevelIds: result.teamLevelIds,
        targetCategoryLevelId: result.targetCategoryLevelId,
      },
    );
  }
}
