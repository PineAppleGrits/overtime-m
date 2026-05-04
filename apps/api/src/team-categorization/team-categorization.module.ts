import { Module } from '@nestjs/common';
import { CategoryLevelsModule } from '../category-levels/category-levels.module';
import { CATEGORIZATION_CHECK_PORT } from './application/ports/categorization-check.port';
import { TEAM_CATEGORY_LEVEL_REPOSITORY } from './application/ports/team-category-level.repository';
import { CategorizationCheckService } from './application/services/categorization-check.service';
import { AssignTeamCategorizationUseCase } from './application/use-cases/assign-team-categorization.use-case';
import { GetTeamCategorizationUseCase } from './application/use-cases/get-team-categorization.use-case';
import { ListPendingCategorizationUseCase } from './application/use-cases/list-pending-categorization.use-case';
import { RemoveTeamLevelUseCase } from './application/use-cases/remove-team-level.use-case';
import { PrismaTeamCategoryLevelRepository } from './infrastructure/repositories/prisma-team-category-level.repository';
import { TeamCategorizationController } from './presentation/controllers/team-categorization.controller';

/**
 * Categorización de equipos (RN-039, RN-044).
 *
 * Expone:
 * - Endpoints HTTP (asignar/reemplazar/quitar/ver/listar pendientes).
 * - `CATEGORIZATION_CHECK_PORT` para que otros módulos (W2.2 Registrations)
 *   validen elegibilidad sin acoplarse al repositorio.
 */
@Module({
  imports: [CategoryLevelsModule],
  controllers: [TeamCategorizationController],
  providers: [
    AssignTeamCategorizationUseCase,
    GetTeamCategorizationUseCase,
    RemoveTeamLevelUseCase,
    ListPendingCategorizationUseCase,
    {
      provide: TEAM_CATEGORY_LEVEL_REPOSITORY,
      useClass: PrismaTeamCategoryLevelRepository,
    },
    {
      provide: CATEGORIZATION_CHECK_PORT,
      useClass: CategorizationCheckService,
    },
  ],
  exports: [CATEGORIZATION_CHECK_PORT, TEAM_CATEGORY_LEVEL_REPOSITORY],
})
export class TeamCategorizationModule {}
