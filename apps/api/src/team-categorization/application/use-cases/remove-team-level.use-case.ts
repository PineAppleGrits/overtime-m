import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  ITeamCategoryLevelRepository,
  TEAM_CATEGORY_LEVEL_REPOSITORY,
} from '../ports/team-category-level.repository';

@Injectable()
export class RemoveTeamLevelUseCase {
  constructor(
    @Inject(TEAM_CATEGORY_LEVEL_REPOSITORY)
    private readonly teamLevelsRepo: ITeamCategoryLevelRepository,
  ) {}

  async execute(teamId: string, teamCategoryLevelId: string): Promise<void> {
    const removed = await this.teamLevelsRepo.removeForTeam(
      teamId,
      teamCategoryLevelId,
    );
    if (!removed) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Asignación de nivel no encontrada para este equipo',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
