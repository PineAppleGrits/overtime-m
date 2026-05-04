export type DebtType =
  | 'REGISTRATION_FEE'
  | 'INSURANCE'
  | 'LATE_ROSTER_FEE'
  | 'MATCH_FEE'
  | 'FRIENDLY_DEPOSIT'
  | 'MISSED_MATCH_FINE'
  | 'LATE_NOTICE_FINE'
  | 'LATE_PAYMENT_DAILY_CHARGE'
  | 'OVERDUE_INTEREST'
  | 'AJC_FEE'
  | 'OTHER_MANUAL';

export type DebtStatus =
  | 'APPROVED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'DELETED_BY_ERROR'
  | 'DELETED_WITH_RECORD'
  | 'CANCELLED';

export interface DebtDto {
  id: string;
  type: DebtType;
  status: DebtStatus;
  concept: string;
  originAmount: string; // Decimal como string
  currentBalance: string;
  currency: string;
  dueDate: string; // ISO

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
}

export interface DebtAuditDto {
  id: string;
  debtId: string;
  fromStatus: DebtStatus;
  toStatus: DebtStatus;
  reason: string | null;
  byProfileId: string;
  at: string;
}
