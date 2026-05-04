/**
 * Puerto mínimo para consultar info de Debt desde Payments. Aísla del módulo
 * Debts cuando lo único que necesitamos es la lectura del balance.
 *
 * Para la escritura (applyPayment), Payments inyecta directamente
 * `DebtsService` (W2.1) — eso ya es un facade público y representa el
 * contrato del módulo Debts.
 */
import { Prisma } from '@prisma/client';

export interface DebtSummaryForPayment {
  id: string;
  type: string;
  status: string;
  concept: string;
  currentBalance: Prisma.Decimal;
  originAmount: Prisma.Decimal;
  currency: string;
  teamId: string | null;
  profileId: string | null;
  registrationId: string | null;
  matchId: string | null;
  friendlyId: string | null;
  metadata: Prisma.JsonValue | null;
}

export interface IDebtContextPort {
  getById(debtId: string): Promise<DebtSummaryForPayment | null>;
  /**
   * Devuelve TODAS las debts asociadas a una registration (entry + insurance).
   */
  listByRegistrationId(
    registrationId: string,
  ): Promise<DebtSummaryForPayment[]>;
  /**
   * RN-017 — ¿Este profile ya tiene una INSURANCE PAID en otra registration
   * del mismo año?
   */
  hasReusableInsurance(input: {
    profileId: string;
    sportId?: string;
    year: number;
  }): Promise<boolean>;
}

export const DEBT_CONTEXT_PORT = Symbol('DEBT_CONTEXT_PORT');
