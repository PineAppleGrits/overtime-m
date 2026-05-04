import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from './categories/categories.module';
import { ZonesModule } from './zones/zones.module';
import { ChangeTournamentStatusUseCase } from './application/use-cases/change-status.use-case';
import { ValidateModalityUseCase } from './application/use-cases/validate-modality.use-case';
import { GetSportRulesPublicUseCase } from './application/use-cases/get-sport-rules-public.use-case';
import { TOURNAMENT_REPOSITORY } from './application/ports/tournament-repository.port';
import { PrismaTournamentRepository } from './infrastructure/repositories/prisma-tournament.repository';
import { SportRulesController } from './presentation/controllers/sport-rules.controller';

/**
 * NOTA W2.3:
 *
 * Los endpoints de pricing periods (`tournaments/:id/pricing`) y sus use-cases
 * fueron migrados al módulo `PricingModule` (apps/api/src/pricing/) para sumar
 * la dimensión `paymentMethod` (RN-048) sin acoplar el módulo Tournaments.
 *
 * Aquí permanecen `TournamentsService`, `TournamentsController`, change-status,
 * validate-modality y sport-rules. La migración mantiene compat de URLs.
 */
@Module({
  imports: [DatabaseModule, CategoriesModule, ZonesModule],
  controllers: [TournamentsController, SportRulesController],
  providers: [
    TournamentsService,
    // Repositories (port → implementation binding)
    {
      provide: TOURNAMENT_REPOSITORY,
      useClass: PrismaTournamentRepository,
    },
    // Use-cases
    ValidateModalityUseCase,
    ChangeTournamentStatusUseCase,
    GetSportRulesPublicUseCase,
  ],
  exports: [TournamentsService],
})
export class TournamentsModule {}
