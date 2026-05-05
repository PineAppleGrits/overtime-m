/**
 * Transiciones permitidas para `SanctionStatus`.
 *
 * Estados: ACTIVE | RESOLVED | EXPIRED | CANCELLED.
 *
 * - ACTIVE → RESOLVED (admin marca como resuelta).
 * - ACTIVE → CANCELLED (admin cancela).
 * - ACTIVE → EXPIRED (auto: el tiempo ya pasó). No se setea por endpoint;
 *   los listeners / scheduled jobs lo manejan.
 * - RESOLVED, EXPIRED, CANCELLED son terminales.
 */
export type SanctionStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED';

const ALLOWED: Record<SanctionStatus, ReadonlyArray<SanctionStatus>> = {
  ACTIVE: ['RESOLVED', 'EXPIRED', 'CANCELLED'],
  RESOLVED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export function canTransition(
  from: SanctionStatus,
  to: SanctionStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export function assertCanTransition(
  from: SanctionStatus,
  to: SanctionStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `No se permite transicionar la sanción de ${from} a ${to}`,
    );
  }
}
