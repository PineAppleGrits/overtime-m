import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoryStandingsController } from './category-standings.controller';
import { DatabaseModule } from '../../database/database.module';
import { GetPlayoffConfigUseCase } from './application/use-cases/get-playoff-config.use-case';
import { UpdatePlayoffConfigUseCase } from './application/use-cases/update-playoff-config.use-case';
import { TransitionCategorySubstatusUseCase } from './application/use-cases/transition-substatus.use-case';
import { LinkCategoryLevelUseCase } from './application/use-cases/link-category-level.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController, CategoryStandingsController],
  providers: [
    CategoriesService,
    GetPlayoffConfigUseCase,
    UpdatePlayoffConfigUseCase,
    TransitionCategorySubstatusUseCase,
    LinkCategoryLevelUseCase,
  ],
  exports: [
    CategoriesService,
    GetPlayoffConfigUseCase,
    UpdatePlayoffConfigUseCase,
    TransitionCategorySubstatusUseCase,
  ],
})
export class CategoriesModule {}
