import { Inject, Injectable } from '@nestjs/common';
import { CategoryLevel } from '../../domain/entities/category-level.entity';
import { sortByRankAsc } from '../../domain/rules/category-level.rules';
import {
  CATEGORY_LEVEL_REPOSITORY,
  ICategoryLevelRepository,
} from '../ports/category-level.repository';

@Injectable()
export class ListCategoryLevelsUseCase {
  constructor(
    @Inject(CATEGORY_LEVEL_REPOSITORY)
    private readonly repo: ICategoryLevelRepository,
  ) {}

  async execute(sportId: string): Promise<CategoryLevel[]> {
    const levels = await this.repo.listBySport(sportId);
    return sortByRankAsc(levels);
  }
}
