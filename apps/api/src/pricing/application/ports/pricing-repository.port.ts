import { TournamentRegistrationPricing } from '@prisma/client';
import { PaymentMethod } from '../../domain/rules/payment-method.rules';

/**
 * Vista de un período de pricing con la dimensión `paymentMethod` ya
 * decodificada (RN-048).
 *
 * El campo `currency` SOLO contiene el código ISO (ej. ARS) — sin sufijo de
 * método. La dimensión `paymentMethod` viene en su propio campo.
 *
 * El record crudo de Prisma sigue siendo `TournamentRegistrationPricing`
 * (sin paymentMethod columnar). El repositorio se ocupa de la traducción.
 *
 * TODO: schema-v2 — paymentMethod columnar.
 */
export interface PricingRecord {
  id: string;
  tournamentId: string;
  validFrom: Date;
  validTo: Date;
  entryFeeAmount: number;
  currency: string;
  paymentMethod: PaymentMethod | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePricingInput {
  tournamentId: string;
  validFrom: Date;
  validTo: Date;
  entryFeeAmount: number;
  currency?: string;
  paymentMethod?: PaymentMethod | null;
}

export interface UpdatePricingInput {
  validFrom?: Date;
  validTo?: Date;
  entryFeeAmount?: number;
  currency?: string;
  paymentMethod?: PaymentMethod | null;
}

export interface ListPricingFilter {
  tournamentId: string;
  /** Si se setea, sólo devuelve períodos para ese método (no incluye fallback null). */
  paymentMethod?: PaymentMethod | null;
}

/**
 * Port del repositorio de pricing.
 *
 * Las implementaciones concretas viven en `infrastructure/repositories/`.
 * Los use-cases dependen sólo de esta interfaz.
 */
export interface IPricingRepository {
  listByTournament(filter: ListPricingFilter): Promise<PricingRecord[]>;
  findById(id: string): Promise<PricingRecord | null>;
  create(input: CreatePricingInput): Promise<PricingRecord>;
  update(id: string, input: UpdatePricingInput): Promise<PricingRecord>;
  delete(id: string): Promise<void>;
  /** Solo para acceso de migración / debug — devuelve la fila Prisma cruda. */
  findRawById(id: string): Promise<TournamentRegistrationPricing | null>;
}

export const PRICING_REPOSITORY = Symbol('PRICING_REPOSITORY');
