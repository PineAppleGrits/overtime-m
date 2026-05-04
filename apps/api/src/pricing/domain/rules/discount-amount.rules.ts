/**
 * RN-020 — descuentos manuales aplicados a equipos.
 *
 * Reglas puras para validar y normalizar el monto de un descuento.
 *
 * Modelado: un descuento se persiste como `Debt` con:
 *   - `type = OTHER_MANUAL`
 *   - `metadata.kind = 'DISCOUNT'`
 *   - `originAmount` y `currentBalance` NEGATIVOS (representa crédito a favor).
 *
 * El monto que ingresa el admin SIEMPRE es positivo; el repositorio se
 * encarga de invertir el signo al persistir.
 */

const MAX_AMOUNT = 10_000_000; // 10M por descuento — sanity check.

export interface DiscountAmountValidationError {
  reason:
    | 'NOT_POSITIVE'
    | 'TOO_LARGE'
    | 'TOO_MANY_DECIMALS'
    | 'NOT_FINITE';
  amount: number;
}

export function validateDiscountAmount(
  amount: number,
): DiscountAmountValidationError | null {
  if (!Number.isFinite(amount)) {
    return { reason: 'NOT_FINITE', amount };
  }
  if (amount <= 0) {
    return { reason: 'NOT_POSITIVE', amount };
  }
  if (amount > MAX_AMOUNT) {
    return { reason: 'TOO_LARGE', amount };
  }
  // Limita a 2 decimales (centavos).
  const scaled = amount * 100;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-6) {
    return { reason: 'TOO_MANY_DECIMALS', amount };
  }
  return null;
}

/**
 * Convierte el monto positivo ingresado por el admin al monto persistido en
 * la `Debt` (negativo, redondeado a 2 decimales).
 */
export function toPersistedDebtAmount(positiveAmount: number): number {
  const cents = Math.round(positiveAmount * 100);
  return -(cents / 100);
}

/**
 * Convierte el monto persistido (negativo) al monto que ve el admin (positivo).
 */
export function toDisplayDiscountAmount(persistedAmount: number): number {
  return Math.abs(persistedAmount);
}

export const DISCOUNT_METADATA_KIND = 'DISCOUNT' as const;

export function isDiscountMetadata(
  metadata: unknown,
): metadata is { kind: typeof DISCOUNT_METADATA_KIND; [k: string]: unknown } {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    (metadata as Record<string, unknown>).kind === DISCOUNT_METADATA_KIND
  );
}
