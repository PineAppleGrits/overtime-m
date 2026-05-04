import { SportRules } from '../../../common/sport-rules/sport-rules.types';

export interface StaffCounts {
  /** MatchStaff confirmados con role='referee'. */
  referees: number;
  /** MatchStaff confirmados con role='table_official'. */
  tableOfficials: number;
}

/**
 * RN-049 — Mínimo de staff para arrancar el partido.
 *
 * Devuelve null si pasa, mensaje si falta staff.
 */
export function checkMinStaff(
  rules: SportRules,
  counts: StaffCounts,
): string | null {
  if (counts.referees < rules.staff.minReferees) {
    return `Faltan árbitros confirmados. Requeridos: ${rules.staff.minReferees}, asignados: ${counts.referees}.`;
  }
  if (counts.tableOfficials < rules.staff.minTableOfficials) {
    return `Faltan oficiales de mesa confirmados. Requeridos: ${rules.staff.minTableOfficials}, asignados: ${counts.tableOfficials}.`;
  }
  return null;
}

/**
 * Tiempo mínimo (en horas) hasta el partido para considerar
 * "cancelación en tiempo" (RN-032).
 */
export const CANCEL_IN_TIME_HOURS = 72;

/**
 * Calcula horas de antelación entre `now` y `matchDate`. Si el match ya
 * pasó, devuelve 0.
 */
export function hoursUntilMatch(matchDate: Date, now: Date): number {
  const diffMs = matchDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60);
}

/**
 * RN-032 — ¿El equipo está a tiempo de cancelar (≥72hs)?
 */
export function isWithinCancelWindow(matchDate: Date, now: Date): boolean {
  return hoursUntilMatch(matchDate, now) >= CANCEL_IN_TIME_HOURS;
}

/**
 * RN-052 / DP-013 — ¿La antelación supera el umbral del torneo para
 * reprogramar sin penalización?
 *
 * Si el torneo no tiene umbral configurado, el comportamiento por
 * defecto es permitir solo si está dentro del plazo de 72hs (alineado
 * con RN-032 — más restrictivo, no podemos asumir cualquier antelación).
 *
 * El umbral del torneo es el "valor mínimo" — antelaciones mayores
 * habilitan reprogramación sin multa.
 */
export function meetsRescheduleThreshold(
  matchDate: Date,
  now: Date,
  thresholdHours: number | null | undefined,
): boolean {
  const hours = hoursUntilMatch(matchDate, now);
  if (thresholdHours === null || thresholdHours === undefined) {
    // TODO: DP-013 — sin umbral configurado, default = 72hs (RN-032).
    return hours >= CANCEL_IN_TIME_HOURS;
  }
  return hours >= thresholdHours;
}
