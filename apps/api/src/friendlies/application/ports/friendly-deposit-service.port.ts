/**
 * Port para crear las dos señas (Debt) cuando un amistoso se genera (RN-022).
 *
 * Implementación interna en `infrastructure/services/friendly-deposit.service.ts`
 * que toca Prisma directo. TODO: refactor a `IDebtRepository` una vez mergeado
 * el módulo Debts (W2.1).
 */

export interface CreateFriendlyDepositsInput {
  friendlyId: string;
  homeTeamId: string;
  awayTeamId: string;
  /** Monto por equipo (cada Debt tiene este originAmount/currentBalance). */
  depositAmount: number;
  /** RN-023 — vencimiento típicamente now + 24h. */
  dueDate: Date;
  /** Admin que generó el amistoso (createdByProfileId del Debt). */
  createdByProfileId: string;
  currency?: string;
}

export interface FriendlyDepositInfo {
  id: string;
  teamId: string;
  status: string;
}

export interface IFriendlyDepositService {
  /** Crea 2 Debts (FRIENDLY_DEPOSIT) — una por equipo. */
  createDeposits(
    input: CreateFriendlyDepositsInput,
  ): Promise<{ home: FriendlyDepositInfo; away: FriendlyDepositInfo }>;

  /** Cancela todas las señas pendientes asociadas (status=CANCELLED). */
  cancelDepositsForFriendly(friendlyId: string, reason: string): Promise<void>;

  /** Lookup util para listeners — ¿este debtId es una FRIENDLY_DEPOSIT? */
  findDepositById(debtId: string): Promise<{
    id: string;
    friendlyId: string | null;
    teamId: string | null;
    status: string;
    type: string;
  } | null>;

  /**
   * Devuelve las señas asociadas a un amistoso (para chequear cuántas
   * están pagas y decidir si confirmamos el match).
   */
  listByFriendly(friendlyId: string): Promise<FriendlyDepositInfo[]>;
}

export const FRIENDLY_DEPOSIT_SERVICE = Symbol('FRIENDLY_DEPOSIT_SERVICE');
