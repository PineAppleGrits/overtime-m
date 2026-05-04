import { Debt } from '@prisma/client';

/**
 * Port del repositorio de descuentos manuales (RN-020).
 *
 * Implementación: una `Debt` con `type=OTHER_MANUAL`, `metadata.kind='DISCOUNT'`,
 * y `originAmount` / `currentBalance` NEGATIVOS (crédito a favor del equipo).
 */
export type DiscountRecord = Debt;

export interface CreateDiscountInput {
  teamId: string;
  /** Monto positivo provisto por el admin. El repo lo persiste como negativo. */
  amount: number;
  currency?: string;
  concept: string;
  notes?: string | null;
  /** Metadata adicional opcional (se mergea con `kind=DISCOUNT`). */
  metadata?: Record<string, unknown>;
  /** Deuda contra la que se aplica el descuento (opcional). Si se setea, va a `parentDebtId`. */
  sourceDebtId?: string;
  createdByProfileId: string;
  /** Default = ahora. Es la fecha de "vencimiento" del crédito; informativo. */
  dueDate?: Date;
}

export interface ListDiscountsFilter {
  teamId?: string;
  /** Si es `true`, incluye los descuentos cancelados; default: solo activos. */
  includeCancelled?: boolean;
}

export interface IDiscountRepository {
  create(input: CreateDiscountInput): Promise<DiscountRecord>;
  findById(id: string): Promise<DiscountRecord | null>;
  list(filter: ListDiscountsFilter): Promise<DiscountRecord[]>;
  cancel(
    id: string,
    cancelledByProfileId: string,
    reason?: string,
  ): Promise<DiscountRecord>;
}

export const DISCOUNT_REPOSITORY = Symbol('DISCOUNT_REPOSITORY');
