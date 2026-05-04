import { DebtWithRelations } from '../../application/ports/debt-repository.port';

/**
 * Convierte la entidad Prisma + relaciones a un DTO plano para el FE.
 * Decimal y Date se serializan como string para evitar pérdidas en JSON.
 */
export interface DebtResponseDto {
  id: string;
  type: string;
  status: string;
  concept: string;
  originAmount: string;
  currentBalance: string;
  currency: string;
  dueDate: string;

  teamId: string | null;
  profileId: string | null;
  registrationId: string | null;
  matchId: string | null;
  friendlyId: string | null;
  sanctionId: string | null;
  parentDebtId: string | null;

  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdByProfileId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    profileId: string;
    processedAt: string | null;
    createdAt: string;
  }>;
  childDebts?: Array<{
    id: string;
    type: string;
    status: string;
    concept: string;
    originAmount: string;
    currentBalance: string;
    dueDate: string;
    createdAt: string;
  }>;
  audits?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    reason: string | null;
    byProfileId: string;
    at: string;
  }>;
}

export function toDebtResponseDto(
  debt: DebtWithRelations,
  options: { includeRelations?: boolean } = {},
): DebtResponseDto {
  const includeRelations = options.includeRelations ?? false;

  const base: DebtResponseDto = {
    id: debt.id,
    type: debt.type,
    status: debt.status,
    concept: debt.concept,
    originAmount: debt.originAmount.toString(),
    currentBalance: debt.currentBalance.toString(),
    currency: debt.currency,
    dueDate: debt.dueDate.toISOString(),

    teamId: debt.teamId,
    profileId: debt.profileId,
    registrationId: debt.registrationId,
    matchId: debt.matchId,
    friendlyId: debt.friendlyId,
    sanctionId: debt.sanctionId,
    parentDebtId: debt.parentDebtId,

    notes: debt.notes,
    metadata: (debt.metadata as Record<string, unknown> | null) ?? null,
    createdByProfileId: debt.createdByProfileId,
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString(),
    deletedAt: debt.deletedAt?.toISOString() ?? null,
  };

  if (!includeRelations) return base;

  return {
    ...base,
    payments: (debt.payments ?? []).map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      status: p.status,
      profileId: p.profileId,
      processedAt: p.processedAt ? p.processedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    })),
    childDebts: (debt.childDebts ?? []).map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      concept: c.concept,
      originAmount: c.originAmount.toString(),
      currentBalance: c.currentBalance.toString(),
      dueDate: c.dueDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
    audits: (debt.audits ?? []).map((a) => ({
      id: a.id,
      fromStatus: a.fromStatus,
      toStatus: a.toStatus,
      reason: a.reason,
      byProfileId: a.byProfileId,
      at: a.at.toISOString(),
    })),
  };
}
