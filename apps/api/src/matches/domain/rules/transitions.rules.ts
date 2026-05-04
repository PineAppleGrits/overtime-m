/**
 * Transiciones de estado permitidas para `Match.status`.
 *
 * Mantiene compatibilidad con los estados originales (programado, en_curso,
 * suspendido, cancelado, reprogramado, finalizado) y suma los nuevos de W3.1:
 *
 * - `pending_rival_decision` (RN-032) — un equipo canceló dentro del plazo de
 *   72hs y el rival debe decidir entre reprogramar o pedir 20-0.
 * - `suspendido_a_reanudar` (RN-054) — el partido se suspendió durante el
 *   juego y se reanudará en otra fecha.
 * - `suspendido_pendiente` (RN-055) — el admin aún no resolvió la suspensión.
 * - `finalizado_con_resolucion` (RN-054) — terminó sin continuidad,
 *   resolución administrativa.
 */

export const MATCH_STATUS = {
  PROGRAMADO: 'programado',
  EN_CURSO: 'en_curso',
  SUSPENDIDO: 'suspendido',
  CANCELADO: 'cancelado',
  REPROGRAMADO: 'reprogramado',
  FINALIZADO: 'finalizado',
  PENDING_RIVAL_DECISION: 'pending_rival_decision',
  SUSPENDIDO_A_REANUDAR: 'suspendido_a_reanudar',
  SUSPENDIDO_PENDIENTE: 'suspendido_pendiente',
  FINALIZADO_CON_RESOLUCION: 'finalizado_con_resolucion',
} as const;

export type MatchStatusValue = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

const TRANSITIONS: Record<string, MatchStatusValue[]> = {
  [MATCH_STATUS.PROGRAMADO]: [
    MATCH_STATUS.EN_CURSO,
    MATCH_STATUS.SUSPENDIDO,
    MATCH_STATUS.CANCELADO,
    MATCH_STATUS.REPROGRAMADO,
    MATCH_STATUS.PENDING_RIVAL_DECISION,
    MATCH_STATUS.FINALIZADO, // cancelación mutua / request_points dejan FINALIZADO
  ],
  [MATCH_STATUS.EN_CURSO]: [
    MATCH_STATUS.SUSPENDIDO,
    MATCH_STATUS.SUSPENDIDO_A_REANUDAR,
    MATCH_STATUS.SUSPENDIDO_PENDIENTE,
    MATCH_STATUS.FINALIZADO,
    MATCH_STATUS.FINALIZADO_CON_RESOLUCION,
    MATCH_STATUS.CANCELADO,
  ],
  [MATCH_STATUS.SUSPENDIDO]: [
    MATCH_STATUS.EN_CURSO,
    MATCH_STATUS.CANCELADO,
    MATCH_STATUS.REPROGRAMADO,
    MATCH_STATUS.FINALIZADO,
    MATCH_STATUS.FINALIZADO_CON_RESOLUCION,
  ],
  [MATCH_STATUS.SUSPENDIDO_A_REANUDAR]: [
    MATCH_STATUS.EN_CURSO,
    MATCH_STATUS.PROGRAMADO,
    MATCH_STATUS.REPROGRAMADO,
    MATCH_STATUS.FINALIZADO_CON_RESOLUCION,
    MATCH_STATUS.CANCELADO,
  ],
  [MATCH_STATUS.SUSPENDIDO_PENDIENTE]: [
    MATCH_STATUS.SUSPENDIDO_A_REANUDAR,
    MATCH_STATUS.FINALIZADO_CON_RESOLUCION,
    MATCH_STATUS.CANCELADO,
  ],
  [MATCH_STATUS.PENDING_RIVAL_DECISION]: [
    MATCH_STATUS.PROGRAMADO, // rival pidió reprogramar
    MATCH_STATUS.REPROGRAMADO,
    MATCH_STATUS.FINALIZADO, // rival pidió 20-0
    MATCH_STATUS.CANCELADO,
  ],
  [MATCH_STATUS.REPROGRAMADO]: [
    MATCH_STATUS.PROGRAMADO,
    MATCH_STATUS.CANCELADO,
  ],
  // Terminales
  [MATCH_STATUS.CANCELADO]: [],
  [MATCH_STATUS.FINALIZADO]: [],
  [MATCH_STATUS.FINALIZADO_CON_RESOLUCION]: [],
};

export function canTransitionMatchStatus(
  from: string,
  to: MatchStatusValue,
): boolean {
  const allowed = TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

export function listAllowedTransitions(from: string): MatchStatusValue[] {
  return [...(TRANSITIONS[from] ?? [])];
}

export function isTerminal(status: string): boolean {
  return (
    status === MATCH_STATUS.CANCELADO ||
    status === MATCH_STATUS.FINALIZADO ||
    status === MATCH_STATUS.FINALIZADO_CON_RESOLUCION
  );
}
