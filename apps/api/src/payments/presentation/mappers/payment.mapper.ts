import { PaymentWithRelations } from '../../application/ports/payment-repository.port';

export interface PaymentResponseDto {
  id: string;
  debtId: string | null;
  registrationId: string | null;
  matchId: string | null;
  profileId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  providerPaymentId: string | null;
  providerResponse: unknown;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;

  profile?: {
    id: string;
    name: string;
    email: string | null;
  };
  registration?: {
    id: string;
    status: string;
    team: { id: string; name: string };
    tournament: { id: string; name: string };
    category: { id: string; name: string } | null;
  } | null;
  match?: {
    id: string;
    matchDate: string | null;
    homeTeam: { id: string; name: string } | null;
    awayTeam: { id: string; name: string } | null;
  } | null;
  debt?: {
    id: string;
    type: string;
    status: string;
    concept: string;
    currentBalance: string;
    originAmount: string;
    currency: string;
    teamId: string | null;
    profileId: string | null;
    friendlyId: string | null;
    registrationId: string | null;
    matchId: string | null;
  } | null;
}

export function toPaymentResponseDto(
  payment: PaymentWithRelations,
): PaymentResponseDto {
  return {
    id: payment.id,
    debtId: payment.debtId,
    registrationId: payment.registrationId,
    matchId: payment.matchId,
    profileId: payment.profileId,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    providerPaymentId: payment.providerPaymentId,
    providerResponse: payment.providerResponse,
    processedAt: payment.processedAt
      ? payment.processedAt.toISOString()
      : null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    profile: payment.profile,
    registration: payment.registration,
    match: payment.match
      ? {
          ...payment.match,
          matchDate: payment.match.matchDate
            ? payment.match.matchDate.toISOString()
            : null,
        }
      : null,
    debt: payment.debt
      ? {
          ...payment.debt,
          currentBalance: payment.debt.currentBalance.toString(),
          originAmount: payment.debt.originAmount.toString(),
        }
      : null,
  };
}
