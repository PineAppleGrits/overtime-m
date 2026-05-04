import { Inject, Injectable } from '@nestjs/common';
import {
  ITeamCategoryLevelRepository,
  TEAM_CATEGORY_LEVEL_REPOSITORY,
} from '../ports/team-category-level.repository';

/**
 * RN-039 — equipos con suficientes amistosos observados para que la
 * organización los categorice. DP-008 — la cantidad mínima X de amistosos
 * está pendiente de definición; usamos 3 como default razonable.
 */
// TODO: DP-008 — confirmar cantidad mínima de amistosos para categorizar.
export const DEFAULT_MIN_OBSERVED_FRIENDLIES_FOR_CATEGORIZATION = 3;

export interface PendingCategorizationItem {
  teamId: string;
  teamName: string;
  observedFriendlies: number;
}

@Injectable()
export class ListPendingCategorizationUseCase {
  constructor(
    @Inject(TEAM_CATEGORY_LEVEL_REPOSITORY)
    private readonly teamLevelsRepo: ITeamCategoryLevelRepository,
  ) {}

  async execute(
    minObserved: number = DEFAULT_MIN_OBSERVED_FRIENDLIES_FOR_CATEGORIZATION,
  ): Promise<PendingCategorizationItem[]> {
    return this.teamLevelsRepo.listPendingCategorization(minObserved);
  }
}
