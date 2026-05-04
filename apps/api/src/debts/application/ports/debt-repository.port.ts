import { Debt, DebtStatus, DebtType, Prisma } from '@prisma/client';
import { DebtState } from '../../domain/entities/debt.entity';

/**
 * Tipo enriquecido devuelto por `findById` — incluye los pagos asociados,
 * las debts hijas (intereses RN-028) y el log de auditoría (RN-031), para
 * que el endpoint de detalle no haga round-trips extra.
 */
export type DebtWithRelations = Debt & {
  payments: {
    id: string;
    amount: number;
    method: string;
    status: string;
    profileId: string;
    processedAt: Date | null;
    createdAt: Date;
  }[];
  childDebts: Pick<
    Debt,
    | 'id'
    | 'type'
    | 'status'
    | 'concept'
    | 'originAmount'
    | 'currentBalance'
    | 'dueDate'
    | 'createdAt'
  >[];
  audits: {
    id: string;
    fromStatus: DebtStatus;
    toStatus: DebtStatus;
    reason: string | null;
    byProfileId: string;
    at: Date;
  }[];
};

export interface CreateDebtInput {
  type: DebtType;
  concept: string;
  originAmount: Prisma.Decimal;
  currentBalance: Prisma.Decimal;
  currency: string;
  dueDate: Date;
  teamId?: string | null;
  profileId?: string | null;
  registrationId?: string | null;
  matchId?: string | null;
  friendlyId?: string | null;
  sanctionId?: string | null;
  parentDebtId?: string | null;
  notes?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  createdByProfileId: string;
  status?: DebtStatus;
}

export interface ListDebtsFilter {
  teamId?: string;
  profileId?: string;
  status?: DebtStatus;
  statuses?: DebtStatus[];
  type?: DebtType;
  from?: Date;
  to?: Date;
  /** Solo deudas con dueDate < now y balance > 0 en estados activos. */
  overdueOnly?: boolean;
  /** Cuando se llama desde un usuario no-admin: limitar a estos teamIds. */
  visibleTeamIds?: string[];
  /** Cuando se llama desde un usuario no-admin: limitar a este profileId. */
  visibleProfileId?: string;
  page?: number;
  limit?: number;
}

/**
 * Buscar Debts vencidas que generan cargos diarios (RN-028, RN-029).
 *
 * Filtros:
 * - status ∈ {APPROVED, PARTIALLY_PAID}
 * - currentBalance > 0
 * - dueDate < startOfToday
 * - type ∈ types (parametrizable: el cron OVERDUE_INTEREST excluye REGISTRATION_FEE/INSURANCE,
 *   el cron LATE_PAYMENT_DAILY_CHARGE incluye sólo esos dos)
 */
export interface FindOverdueDebtsFilter {
  beforeDate: Date;
  types?: DebtType[];
  excludeTypes?: DebtType[];
  /** Cap de seguridad por corrida del cron. */
  take?: number;
}

export interface FindChildDebtForDayFilter {
  parentDebtId: string;
  type: DebtType;
  dayKey: string;
}

export interface IDebtRepository {
  create(input: CreateDebtInput): Promise<DebtWithRelations>;
  findById(id: string): Promise<DebtWithRelations | null>;
  list(
    filter: ListDebtsFilter,
  ): Promise<{ data: DebtWithRelations[]; total: number }>;

  /**
   * Persiste un patch parcial sobre el state. Devuelve la fila enriquecida.
   */
  updateState(
    id: string,
    patch: Partial<DebtState>,
  ): Promise<DebtWithRelations>;

  /**
   * Cambio de estado + audit log en una transacción (RN-031).
   */
  changeStatus(
    id: string,
    fromStatus: DebtStatus,
    toStatus: DebtStatus,
    byProfileId: string,
    reason?: string,
  ): Promise<DebtWithRelations>;

  /**
   * Aplica un pago al currentBalance + actualiza status y crea audit log
   * en una sola transacción.
   */
  applyPayment(
    id: string,
    paidAmount: Prisma.Decimal,
    paidByProfileId: string,
  ): Promise<DebtWithRelations>;

  /**
   * Devuelve todas las deudas activas vencidas que matchean el filtro.
   * Usado por los crons de RN-028 y RN-029.
   */
  findOverdue(filter: FindOverdueDebtsFilter): Promise<DebtWithRelations[]>;

  /**
   * Idempotencia diaria: ¿existe ya una deuda hija de tipo `type` para
   * `parentDebtId` con `metadata.dayKey === dayKey`?
   */
  hasChildDebtForDay(filter: FindChildDebtForDayFilter): Promise<boolean>;

  /**
   * RN-053 — chequeo barato: ¿el equipo tiene al menos una deuda activa
   * con dueDate vencida? Devuelve la lista (puede estar vacía).
   */
  findOutstandingForTeam(
    teamId: string,
    now: Date,
  ): Promise<DebtWithRelations[]>;
}

export const DEBT_REPOSITORY = Symbol('DEBT_REPOSITORY');
