import { TournamentRegistrationPricing } from '@prisma/client';

export type PricingRecord = TournamentRegistrationPricing;

export interface CreatePricingInput {
  tournamentId: string;
  validFrom: Date;
  validTo: Date;
  entryFeeAmount: number;
  currency?: string;
}

export interface UpdatePricingInput {
  validFrom?: Date;
  validTo?: Date;
  entryFeeAmount?: number;
  currency?: string;
}

/**
 * Port del repositorio de pricing periods (RN-048).
 */
export interface IPricingRepository {
  listByTournament(tournamentId: string): Promise<PricingRecord[]>;
  findById(id: string): Promise<PricingRecord | null>;
  create(input: CreatePricingInput): Promise<PricingRecord>;
  update(id: string, input: UpdatePricingInput): Promise<PricingRecord>;
  delete(id: string): Promise<void>;
}

export const PRICING_REPOSITORY = Symbol('PRICING_REPOSITORY');
