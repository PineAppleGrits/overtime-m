/**
 * Reglas puras de transición de estado de un torneo.
 *
 * Transiciones permitidas (state machine §2 de docs/specs/tournament-state-machine.md):
 *
 *   DRAFT               → PUBLISHED | ARCHIVED
 *   PUBLISHED           → DRAFT (rollback) | INSCRIPTION_OPEN | ARCHIVED
 *   INSCRIPTION_OPEN    → INSCRIPTION_CLOSED | ARCHIVED
 *   INSCRIPTION_CLOSED  → INSCRIPTION_OPEN (reabrir) | IN_PROGRESS | ARCHIVED
 *   IN_PROGRESS         → INSCRIPTION_CLOSED (rollback) | PLAYING | ARCHIVED
 *   PLAYING             → FINISHED | ARCHIVED
 *   FINISHED            → ARCHIVED
 *   ARCHIVED            → (terminal)
 *
 * ARCHIVED se permite desde cualquier estado no-terminal.
 */
import { TournamentStatus } from '@overtime-mono/shared';

const VALID_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  [TournamentStatus.DRAFT]: [
    TournamentStatus.PUBLISHED,
    TournamentStatus.ARCHIVED,
  ],
  [TournamentStatus.PUBLISHED]: [
    TournamentStatus.DRAFT,
    TournamentStatus.INSCRIPTION_OPEN,
    TournamentStatus.ARCHIVED,
  ],
  [TournamentStatus.INSCRIPTION_OPEN]: [
    TournamentStatus.INSCRIPTION_CLOSED,
    TournamentStatus.ARCHIVED,
  ],
  [TournamentStatus.INSCRIPTION_CLOSED]: [
    TournamentStatus.INSCRIPTION_OPEN,
    TournamentStatus.IN_PROGRESS,
    TournamentStatus.ARCHIVED,
  ],
  [TournamentStatus.IN_PROGRESS]: [
    TournamentStatus.INSCRIPTION_CLOSED,
    TournamentStatus.PLAYING,
    TournamentStatus.ARCHIVED,
  ],
  [TournamentStatus.PLAYING]: [
    TournamentStatus.FINISHED,
    TournamentStatus.ARCHIVED,
  ],
  [TournamentStatus.FINISHED]: [TournamentStatus.ARCHIVED],
  [TournamentStatus.ARCHIVED]: [],
};

const TERMINAL_STATUSES: ReadonlySet<TournamentStatus> = new Set([
  TournamentStatus.ARCHIVED,
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
