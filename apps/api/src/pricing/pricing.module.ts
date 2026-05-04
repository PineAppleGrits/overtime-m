import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DISCOUNT_REPOSITORY } from './application/ports/discount-repository.port';
import { PRICING_REPOSITORY } from './application/ports/pricing-repository.port';
import { TOURNAMENT_LOOKUP_PORT } from './application/ports/tournament-lookup.port';
import { PricingService } from './application/services/pricing.service';
import { ApplyDiscountUseCase } from './application/use-cases/apply-discount.use-case';
import { ApplyFranchiseDiscountsUseCase } from './application/use-cases/apply-franchise-discounts.use-case';
import { CancelDiscountUseCase } from './application/use-cases/cancel-discount.use-case';
import { ComputeRegistrationFeeUseCase } from './application/use-cases/compute-registration-fee.use-case';
import { CreatePricingPeriodUseCase } from './application/use-cases/create-pricing-period.use-case';
import { DeletePricingPeriodUseCase } from './application/use-cases/delete-pricing-period.use-case';
import { GetCurrentPricingUseCase } from './application/use-cases/get-current-pricing.use-case';
import { ListDiscountsUseCase } from './application/use-cases/list-discounts.use-case';
import { ListPricingPeriodsUseCase } from './application/use-cases/list-pricing-periods.use-case';
import { UpdatePricingPeriodUseCase } from './application/use-cases/update-pricing-period.use-case';
import { PrismaDiscountRepository } from './infrastructure/repositories/prisma-discount.repository';
import { PrismaPricingRepository } from './infrastructure/repositories/prisma-pricing.repository';
import { PrismaTournamentLookupRepository } from './infrastructure/repositories/prisma-tournament-lookup.repository';
import { DiscountsController } from './presentation/controllers/discounts.controller';
import { FranchiseDiscountsController } from './presentation/controllers/franchise-discounts.controller';
import { TournamentPricingController } from './presentation/controllers/tournament-pricing.controller';

/**
 * Módulo Pricing & Discounts (W2.3).
 *
 * Cubre:
 *   - RN-021 — todos los montos manipulables sin código (CRUD periods).
 *   - RN-048 — pricing variable por período × método de pago.
 *   - RN-020 — descuentos manuales por equipo (modelados como `Debt` con
 *     `metadata.kind=DISCOUNT` y monto negativo).
 *   - RN-012 / DP-011 — endpoint admin stub (501) para descuento por franquicia.
 *
 * Re-toma los endpoints `/api/v1/tournaments/:id/pricing` que originalmente
 * vivían en `TournamentsModule` (W1.1) — ese módulo deja de registrar el
 * controller de pricing.
 *
 * Exporta `PricingService` para que `PaymentsModule` (W2.2) lo inyecte y
 * compute el fee de inscripción aplicable a un (tournament, paymentMethod, date).
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    TournamentPricingController,
    DiscountsController,
    FranchiseDiscountsController,
  ],
  providers: [
    // Repositorios (port → implementation).
    {
      provide: PRICING_REPOSITORY,
      useClass: PrismaPricingRepository,
    },
    {
      provide: TOURNAMENT_LOOKUP_PORT,
      useClass: PrismaTournamentLookupRepository,
    },
    {
      provide: DISCOUNT_REPOSITORY,
      useClass: PrismaDiscountRepository,
    },
    // Use-cases.
    CreatePricingPeriodUseCase,
    UpdatePricingPeriodUseCase,
    DeletePricingPeriodUseCase,
    ListPricingPeriodsUseCase,
    GetCurrentPricingUseCase,
    ComputeRegistrationFeeUseCase,
    ApplyDiscountUseCase,
    ListDiscountsUseCase,
    CancelDiscountUseCase,
    ApplyFranchiseDiscountsUseCase,
    // Service facade exportado.
    PricingService,
  ],
  exports: [PricingService],
})
export class PricingModule {}
