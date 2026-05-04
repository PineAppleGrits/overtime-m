import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from './categories/categories.module';
import { ZonesModule } from './zones/zones.module';
import { ChangeTournamentStatusUseCase } from './application/use-cases/change-status.use-case';
import { ValidateModalityUseCase } from './application/use-cases/validate-modality.use-case';
import { CreatePricingPeriodUseCase } from './application/use-cases/create-pricing-period.use-case';
import { UpdatePricingPeriodUseCase } from './application/use-cases/update-pricing-period.use-case';
import { DeletePricingPeriodUseCase } from './application/use-cases/delete-pricing-period.use-case';
import { ListPricingPeriodsUseCase } from './application/use-cases/list-pricing-periods.use-case';
import { GetCurrentPricingUseCase } from './application/use-cases/get-current-pricing.use-case';
import { GetSportRulesPublicUseCase } from './application/use-cases/get-sport-rules-public.use-case';
import { TOURNAMENT_REPOSITORY } from './application/ports/tournament-repository.port';
import { PRICING_REPOSITORY } from './application/ports/pricing-repository.port';
import { PrismaTournamentRepository } from './infrastructure/repositories/prisma-tournament.repository';
import { PrismaPricingRepository } from './infrastructure/repositories/prisma-pricing.repository';
import { TournamentPricingController } from './presentation/controllers/tournament-pricing.controller';
import { SportRulesController } from './presentation/controllers/sport-rules.controller';

@Module({
  imports: [DatabaseModule, CategoriesModule, ZonesModule],
  controllers: [
    TournamentsController,
    TournamentPricingController,
    SportRulesController,
  ],
  providers: [
    TournamentsService,
    // Repositories (port → implementation binding)
    {
      provide: TOURNAMENT_REPOSITORY,
      useClass: PrismaTournamentRepository,
    },
    {
      provide: PRICING_REPOSITORY,
      useClass: PrismaPricingRepository,
    },
    // Use-cases
    ValidateModalityUseCase,
    ChangeTournamentStatusUseCase,
    CreatePricingPeriodUseCase,
    UpdatePricingPeriodUseCase,
    DeletePricingPeriodUseCase,
    ListPricingPeriodsUseCase,
    GetCurrentPricingUseCase,
    GetSportRulesPublicUseCase,
  ],
  exports: [TournamentsService],
})
export class TournamentsModule {}
