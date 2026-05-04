import { Module } from '@nestjs/common';
import { CATEGORY_LEVEL_REPOSITORY } from './application/ports/category-level.repository';
import { CreateCategoryLevelUseCase } from './application/use-cases/create-category-level.use-case';
import { DeleteCategoryLevelUseCase } from './application/use-cases/delete-category-level.use-case';
import { ListCategoryLevelsUseCase } from './application/use-cases/list-category-levels.use-case';
import { UpdateCategoryLevelUseCase } from './application/use-cases/update-category-level.use-case';
import { PrismaCategoryLevelRepository } from './infrastructure/repositories/prisma-category-level.repository';
import { CategoryLevelsController } from './presentation/controllers/category-levels.controller';

@Module({
  controllers: [CategoryLevelsController],
  providers: [
    CreateCategoryLevelUseCase,
    ListCategoryLevelsUseCase,
    UpdateCategoryLevelUseCase,
    DeleteCategoryLevelUseCase,
    {
      provide: CATEGORY_LEVEL_REPOSITORY,
      useClass: PrismaCategoryLevelRepository,
    },
  ],
  exports: [CATEGORY_LEVEL_REPOSITORY],
})
export class CategoryLevelsModule {}
