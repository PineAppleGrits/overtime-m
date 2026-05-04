import { Debt } from '@prisma/client';
import { toDisplayDiscountAmount } from '../../domain/rules/discount-amount.rules';

export interface DiscountResponse {
  id: string;
  teamId: string | null;
  /** Monto positivo (lo que el admin "regala"). */
  amount: number;
  currency: string;
  concept: string;
  notes: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  sourceDebtId: string | null;
  createdByProfileId: string;
  createdAt: string;
  updatedAt: string;
}

export function toDiscountResponse(debt: Debt): DiscountResponse {
  return {
    id: debt.id,
    teamId: debt.teamId,
    amount: toDisplayDiscountAmount(Number(debt.originAmount)),
    currency: debt.currency,
    concept: debt.concept,
    notes: debt.notes,
    status: debt.status,
    metadata: (debt.metadata as Record<string, unknown> | null) ?? null,
    sourceDebtId: debt.parentDebtId,
    createdByProfileId: debt.createdByProfileId,
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString(),
  };
}
