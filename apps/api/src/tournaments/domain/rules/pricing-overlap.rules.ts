/**
 * Reglas puras para validar solapamiento de períodos de precio (RN-048).
 *
 * Un torneo puede tener múltiples `TournamentRegistrationPricing` con
 * rangos `[validFrom, validTo]`. Los rangos no pueden superponerse.
 *
 * Convenciones:
 * - Los rangos se consideran cerrados (`validFrom <= t <= validTo`).
 * - Dos rangos se superponen si `aFrom <= bTo && bFrom <= aTo`.
 * - `validFrom` debe ser estrictamente anterior a `validTo`.
 */

export interface PricingPeriod {
  id?: string;
  validFrom: Date;
  validTo: Date;
}

export function isValidPeriod(period: PricingPeriod): boolean {
  return period.validFrom.getTime() < period.validTo.getTime();
}

export function periodsOverlap(a: PricingPeriod, b: PricingPeriod): boolean {
  return (
    a.validFrom.getTime() <= b.validTo.getTime() &&
    b.validFrom.getTime() <= a.validTo.getTime()
  );
}

/**
 * Devuelve la primera entrada de `existing` que se solape con `candidate`,
 * o `null` si no hay conflicto. Excluye explícitamente la entrada con
 * `excludeId` (útil al editar).
 */
export function findOverlappingPeriod(
  candidate: PricingPeriod,
  existing: readonly PricingPeriod[],
  excludeId?: string,
): PricingPeriod | null {
  for (const period of existing) {
    if (excludeId && period.id === excludeId) continue;
    if (periodsOverlap(candidate, period)) return period;
  }
  return null;
}

export function pickCurrentPeriod<T extends PricingPeriod>(
  periods: readonly T[],
  now: Date = new Date(),
): T | null {
  const t = now.getTime();
  return (
    periods.find(
      (p) => p.validFrom.getTime() <= t && t <= p.validTo.getTime(),
    ) ?? null
  );
}
