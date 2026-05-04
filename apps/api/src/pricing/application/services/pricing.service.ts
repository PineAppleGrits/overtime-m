import { Injectable } from '@nestjs/common';
import {
  ComputeRegistrationFeeInput,
  ComputeRegistrationFeeResult,
  ComputeRegistrationFeeUseCase,
} from '../use-cases/compute-registration-fee.use-case';
import {
  GetCurrentPricingInput,
  GetCurrentPricingUseCase,
} from '../use-cases/get-current-pricing.use-case';
import { PricingRecord } from '../ports/pricing-repository.port';

/**
 * Facade público del módulo Pricing — pensado para que otros módulos lo
 * inyecten (ej. W2.2 PaymentsService) sin acoplarse a los use-cases internos.
 *
 * Exportado por `PricingModule.exports`.
 */
@Injectable()
export class PricingService {
  constructor(
    private readonly computeFee: ComputeRegistrationFeeUseCase,
    private readonly getCurrent: GetCurrentPricingUseCase,
  ) {}

  /**
   * RN-048 — calcula el fee de inscripción aplicable.
   * Lanza `BusinessError(PRICING_NOT_CONFIGURED)` si no hay período aplicable.
   */
  computeRegistrationFee(
    input: ComputeRegistrationFeeInput,
  ): Promise<ComputeRegistrationFeeResult> {
    return this.computeFee.execute(input);
  }

  /**
   * Devuelve el período aplicable o `null` (sin lanzar). Útil para vistas.
   */
  getCurrentPricing(
    input: GetCurrentPricingInput,
  ): Promise<PricingRecord | null> {
    return this.getCurrent.execute(input);
  }
}
