import { TournamentRegistrationPricing } from '@prisma/client';

export interface PricingPeriodResponse {
  id: string;
  tournamentId: string;
  validFrom: string;
  validTo: string;
  entryFeeAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export function toPricingPeriodResponse(
  record: TournamentRegistrationPricing,
): PricingPeriodResponse {
  return {
    id: record.id,
    tournamentId: record.tournamentId,
    validFrom: record.validFrom.toISOString(),
    validTo: record.validTo.toISOString(),
    entryFeeAmount: Number(record.entryFeeAmount),
    currency: record.currency,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
