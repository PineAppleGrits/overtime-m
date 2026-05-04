/**
 * RN-048 — overlap considerando la dimensión "método de pago".
 *
 * Extiende `pricing-overlap.rules` (W1.1) sumando la dimensión `paymentMethod`.
 * Dos períodos solo se consideran en conflicto si AMBAS dimensiones se cruzan:
 *
 *   - Rangos de fecha solapan (`a.from <= b.to && b.from <= a.to`).
 *   - Métodos solapan (`null` matchea con todos; específicos solo con el mismo).
 *
 * Funciones puras — no leen de DB.
 */

import { methodsOverlap, PaymentMethod } from './payment-method.rules';

export interface PricingPeriodWithMethod {
  id?: string;
  validFrom: Date;
  validTo: Date;
  paymentMethod: PaymentMethod | null;
}

export function isValidPeriod(period: {
  validFrom: Date;
  validTo: Date;
}): boolean {
  return period.validFrom.getTime() < period.validTo.getTime();
}

export function periodsTimeOverlap(
  a: { validFrom: Date; validTo: Date },
  b: { validFrom: Date; validTo: Date },
): boolean {
  return (
    a.validFrom.getTime() <= b.validTo.getTime() &&
    b.validFrom.getTime() <= a.validTo.getTime()
  );
}

export function periodsConflict(
  a: PricingPeriodWithMethod,
  b: PricingPeriodWithMethod,
): boolean {
  return (
    periodsTimeOverlap(a, b) && methodsOverlap(a.paymentMethod, b.paymentMethod)
  );
}

/**
 * Devuelve la primera entrada de `existing` que entra en conflicto con
 * `candidate`, o `null` si no hay conflicto. Excluye explícitamente la
 * entrada con `excludeId` (caso update).
 */
export function findConflictingPeriod(
  candidate: PricingPeriodWithMethod,
  existing: readonly PricingPeriodWithMethod[],
  excludeId?: string,
): PricingPeriodWithMethod | null {
  for (const period of existing) {
    if (excludeId && period.id === excludeId) continue;
    if (periodsConflict(candidate, period)) return period;
  }
  return null;
}

/**
 * Selecciona el período aplicable para `(method, instant)`.
 *
 * Estrategia:
 * 1. Buscar entre los períodos con el método EXACTO (no-null) cuyo rango
 *    cubra `instant`. Si hay match, gana sobre el fallback.
 * 2. Si no hay match específico, buscar el período con `method=null` cuyo
 *    rango cubra `instant`.
 * 3. Si no hay nada, retornar `null`.
 *
 * Cuando `requestedMethod === null`, se devuelve un match que solo aplica
 * a "todos los métodos" (no-method). Esto es útil para el endpoint público
 * "precio actual" sin filtrar por método.
 */
export function pickApplicablePeriod<T extends PricingPeriodWithMethod>(
  periods: readonly T[],
  requestedMethod: PaymentMethod | null,
  instant: Date = new Date(),
): T | null {
  const t = instant.getTime();
  const inRange = (p: T): boolean =>
    p.validFrom.getTime() <= t && t <= p.validTo.getTime();

  if (requestedMethod) {
    const exact = periods.find(
      (p) => inRange(p) && p.paymentMethod === requestedMethod,
    );
    if (exact) return exact;
  }

  const fallback = periods.find(
    (p) => inRange(p) && p.paymentMethod === null,
  );
  return fallback ?? null;
}
