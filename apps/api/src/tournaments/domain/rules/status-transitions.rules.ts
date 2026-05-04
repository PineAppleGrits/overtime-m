/**
 * Reglas puras de transición de estado de un torneo.
 *
 * Transiciones permitidas (RN-046, decisiones operativas del plan de cierre):
 *
 *   DRAFT          → OPEN | ARCHIVED | CANCELLED
 *   OPEN           → CLOSED | ARCHIVED | CANCELLED
 *   CLOSED         → READY_TO_SHIP | ARCHIVED | CANCELLED
 *   READY_TO_SHIP  → IN_PROGRESS | ARCHIVED | CANCELLED
 *   IN_PROGRESS    → FINISHED | ARCHIVED | CANCELLED
 *   FINISHED       → ARCHIVED
 *   ARCHIVED       → (terminal)
 *   CANCELLED      → (terminal)
 *
 * CANCELLED se permite desde cualquier estado salvo FINISHED y ARCHIVED.
 */
import { TournamentStatus } from '@overtime-mono/shared';

const VALID_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  [TournamentStatus.DRAFT]: [
    TournamentStatus.OPEN,
    TournamentStatus.ARCHIVED,
    TournamentStatus.CANCELLED,
  ],
  [TournamentStatus.OPEN]: [
    TournamentStatus.CLOSED,
    TournamentStatus.ARCHIVED,
    TournamentStatus.CANCELLED,
  ],
  [TournamentStatus.CLOSED]: [
    TournamentStatus.READY_TO_SHIP,
    TournamentStatus.ARCHIVED,
    TournamentStatus.CANCELLED,
  ],
  [TournamentStatus.READY_TO_SHIP]: [
    TournamentStatus.IN_PROGRESS,
    TournamentStatus.ARCHIVED,
    TournamentStatus.CANCELLED,
  ],
  [TournamentStatus.IN_PROGRESS]: [
    TournamentStatus.FINISHED,
    TournamentStatus.ARCHIVED,
    TournamentStatus.CANCELLED,
  ],
  [TournamentStatus.FINISHED]: [TournamentStatus.ARCHIVED],
  [TournamentStatus.ARCHIVED]: [],
  [TournamentStatus.CANCELLED]: [],
};

const TERMINAL_STATUSES: ReadonlySet<TournamentStatus> = new Set([
  TournamentStatus.FINISHED,
  TournamentStatus.ARCHIVED,
  TournamentStatus.CANCELLED,
]);

export function listAllowedTransitions(
  from: TournamentStatus,
): readonly TournamentStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function isValidStatusTransition(
  from: TournamentStatus,
  to: TournamentStatus,
): boolean {
  if (from === to) return false;
  return listAllowedTransitions(from).includes(to);
}

export function isTerminalStatus(status: TournamentStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
