import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  CATEGORY_LEVEL_REPOSITORY,
  ICategoryLevelRepository,
} from '../ports/category-level.repository';

@Injectable()
export class DeleteCategoryLevelUseCase {
  constructor(
    @Inject(CATEGORY_LEVEL_REPOSITORY)
    private readonly repo: ICategoryLevelRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const current = await this.repo.findById(id);
    if (!current) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Nivel de categoría no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const [teams, categories] = await Promise.all([
      this.repo.countTeamsAssigned(id),
      this.repo.countCategoriesUsing(id),
    ]);

    if (teams > 0 || categories > 0) {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        'No se puede eliminar: el nivel tiene equipos o categorías asociadas',
        HttpStatus.CONFLICT,
        { teamsAssigned: teams, categoriesUsing: categories },
      );
    }

    await this.repo.delete(id);
  }
}
