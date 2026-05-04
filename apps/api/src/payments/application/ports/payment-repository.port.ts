import { Payment as PaymentRow, Prisma } from '@prisma/client';
import { PaymentMethodValue } from '../../domain/rules/method-validation.rules';
import { PaymentStatusValue } from '../../domain/rules/transitions.rules';

/**
 * Tipo enriquecido devuelto por queries — incluye las relaciones que el FE
 * y los use-cases usan habitualmente.
 */
export type PaymentWithRelations = PaymentRow & {
  profile: {
    id: string;
    name: string;
    email: string | null;
  };
  registration: {
    id: string;
    status: string;
    team: { id: string; name: string };
    tournament: { id: string; name: string };
    category: { id: string; name: string } | null;
  } | null;
  match: {
    id: string;
    matchDate: Date | null;
    homeTeam: { id: string; name: string } | null;
    awayTeam: { id: string; name: string } | null;
  } | null;
  debt: {
    id: string;
    type: string;
    status: string;
    concept: string;
    currentBalance: Prisma.Decimal;
    originAmount: Prisma.Decimal;
    currency: string;
    teamId: string | null;
    profileId: string | null;
    friendlyId: string | null;
    registrationId: string | null;
    matchId: string | null;
  } | null;
};

export interface CreatePaymentInput {
  debtId?: string | null;
  registrationId?: string | null;
  matchId?: string | null;
  profileId: string;
  amount: number;
  currency: string;
  method: PaymentMethodValue;
  status: PaymentStatusValue;
  providerPaymentId?: string | null;
  providerResponse?: Prisma.InputJsonValue | null;
}

export interface ListPaymentsFilter {
  status?: PaymentStatusValue;
  method?: PaymentMethodValue | string;
  registrationId?: string;
  matchId?: string;
  debtId?: string;
  profileId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdatePaymentInput {
  status?: PaymentStatusValue;
  providerPaymentId?: string | null;
  providerResponse?: Prisma.InputJsonValue | null;
  processedAt?: Date | null;
}

export interface IPaymentRepository {
  create(input: CreatePaymentInput): Promise<PaymentWithRelations>;
  findById(id: string): Promise<PaymentWithRelations | null>;
  findByProviderExternalReference(
    externalRef: string,
  ): Promise<PaymentWithRelations | null>;
  findActiveForResource(resource: {
    debtId?: string;
    registrationId?: string;
    matchId?: string;
  }): Promise<PaymentWithRelations | null>;
  list(filter: ListPaymentsFilter): Promise<{
    data: PaymentWithRelations[];
    total: number;
  }>;
  update(id: string, patch: UpdatePaymentInput): Promise<PaymentWithRelations>;
  /**
   * Resumen agregado para `/payments/summary`.
   */
  getSummary(filter: { startDate?: Date; endDate?: Date }): Promise<{
    totalPayments: number;
    statusBreakdown: Record<string, number>;
    methodBreakdown: Record<string, number>;
    totalCompletedAmount: number;
  }>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
