import { PricingRecord } from '../../application/ports/pricing-repository.port';
import { PaymentMethod } from '../../domain/rules/payment-method.rules';

export interface PricingPeriodResponse {
  id: string;
  tournamentId: string;
  validFrom: string;
  validTo: string;
  entryFeeAmount: number;
  currency: string;
  /** RN-048 — `null` cuando aplica a todos los métodos. */
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

export function toPricingPeriodResponse(
  record: PricingRecord,
): PricingPeriodResponse {
  return {
    id: record.id,
    tournamentId: record.tournamentId,
    validFrom: record.validFrom.toISOString(),
    validTo: record.validTo.toISOString(),
    entryFeeAmount: Number(record.entryFeeAmount),
    currency: record.currency,
    paymentMethod: record.paymentMethod,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
