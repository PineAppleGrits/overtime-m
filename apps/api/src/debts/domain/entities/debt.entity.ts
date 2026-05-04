import { DebtStatus, DebtType, Prisma } from '@prisma/client';
import {
  isAdminAllowedTransition,
  isValidTransition,
  isActiveStatus,
  isTerminalStatus,
} from '../rules/transitions';

/**
 * Snapshot inmutable de una Debt. Refleja columnas relevantes de la tabla;
 * la persistencia completa vive en Prisma.
 *
 * Decisión de diseño: usamos `Prisma.Decimal` para los montos (originAmount,
 * currentBalance) y mantenemos toda la math con esa clase, NUNCA convertimos
 * a `number` para sumar/restar (pérdida de precisión en montos grandes).
 */
export interface DebtState {
  id: string;
  type: DebtType;
  status: DebtStatus;
  concept: string;
  originAmount: Prisma.Decimal;
  currentBalance: Prisma.Decimal;
  currency: string;
  dueDate: Date;
  teamId: string | null;
  profileId: string | null;
  registrationId: string | null;
  matchId: string | null;
  friendlyId: string | null;
  sanctionId: string | null;
  parentDebtId: string | null;
  notes: string | null;
  metadata: Prisma.JsonValue | null;
  createdByProfileId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ApplyPaymentResult {
  /** Nuevo balance tras descontar `paidAmount`. */
  newBalance: Prisma.Decimal;
  /** Estado nuevo: PARTIALLY_PAID o PAID. */
  newStatus: DebtStatus;
  /** True si la deuda quedó completamente saldada. */
  fullyPaid: boolean;
}

/**
 * Entidad de dominio Debt. Encapsula transiciones legales y pago parcial.
 */
export class Debt {
  private constructor(private readonly state: DebtState) {}

  static fromState(state: DebtState): Debt {
    return new Debt(state);
  }

  get id(): string {
    return this.state.id;
  }

  get status(): DebtStatus {
    return this.state.status;
  }

  get type(): DebtType {
    return this.state.type;
  }

  get teamId(): string | null {
    return this.state.teamId;
  }

  get profileId(): string | null {
    return this.state.profileId;
  }

  get currentBalance(): Prisma.Decimal {
    return this.state.currentBalance;
  }

  get originAmount(): Prisma.Decimal {
    return this.state.originAmount;
  }

  get dueDate(): Date {
    return this.state.dueDate;
  }

  toState(): DebtState {
    return { ...this.state };
  }

  isActive(): boolean {
    return isActiveStatus(this.state.status);
  }

  isTerminal(): boolean {
    return isTerminalStatus(this.state.status);
  }

  isPaid(): boolean {
    return this.state.status === 'PAID';
  }

  /**
   * ¿Esta deuda está vencida y aún tiene saldo? Útil para el bloqueo de
   * partidos (RN-053) y cron de intereses (RN-028).
   */
  isOverdue(now: Date = new Date()): boolean {
    if (!this.isActive()) return false;
    if (this.state.currentBalance.lessThanOrEqualTo(0)) return false;
    return this.state.dueDate.getTime() < now.getTime();
  }

  /**
   * DP-006 — flag opcional de la regla del 50%.
   * Devuelve true si la deuda fue saldada al menos al 50% (currentBalance ≤ 50% del origen).
   * NO confunde con `isPaid`: la deuda sigue activa, pero se considera "habilitante" para RN-053
   * cuando la regla del 50% esté habilitada.
   */
  isHalfOrMorePaid(): boolean {
    if (this.state.originAmount.lessThanOrEqualTo(0)) return false;
    const half = this.state.originAmount.div(2);
    return this.state.currentBalance.lessThanOrEqualTo(half);
  }

  canTransitionTo(target: DebtStatus): boolean {
    return isValidTransition(this.state.status, target);
  }

  canAdminTransitionTo(target: DebtStatus): boolean {
    return isAdminAllowedTransition(this.state.status, target);
  }

  /**
   * Aplica un pago al saldo actual. NO crea el `Payment` (eso lo hace W2.2);
   * sólo computa el estado resultante.
   *
   * Validaciones (delegadas al use-case):
   * - `amount > 0`.
   * - `amount <= currentBalance`.
   *
   * Aquí asumimos que ya se validaron y devolvemos el snapshot resultante.
   */
  applyPayment(amount: Prisma.Decimal): ApplyPaymentResult {
    const newBalance = this.state.currentBalance.minus(amount);
    const fullyPaid = newBalance.lessThanOrEqualTo(0);
    const newStatus: DebtStatus = fullyPaid ? 'PAID' : 'PARTIALLY_PAID';
    return { newBalance, newStatus, fullyPaid };
  }
}
