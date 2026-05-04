import { FriendlyStatus } from '@prisma/client';

/**
 * Reglas puras de transición de estado de un amistoso.
 *
 * Transiciones permitidas (RN-022, RN-023, RN-039):
 *
 *   REQUESTED            → GENERATED | CANCELLED
 *   GENERATED            → PENDING_CONFIRMATION | EXPIRED | CANCELLED
 *   PENDING_CONFIRMATION → CONFIRMED | EXPIRED | CANCELLED
 *   CONFIRMED            → PLAYED | CANCELLED
 *   PLAYED               → OBSERVED_FOR_CATEGORIZATION
 *   OBSERVED_FOR_CATEGORIZATION → (terminal)
 *   EXPIRED              → (terminal)
 *   CANCELLED            → (terminal)
 *
 * Notas:
 * - GENERATED → PENDING_CONFIRMATION cuando paga la primera seña.
 * - PENDING_CONFIRMATION → CONFIRMED cuando paga la segunda seña (ambas pagas).
 * - El paso a OBSERVED_FOR_CATEGORIZATION sólo se hace via flag boolean
 *   (`observedForCategorization=true`) sobre un amistoso PLAYED — el status
 *   se mantiene en PLAYED y el flag indica que el partido se considera
 *   para la categorización del equipo (RN-039).
 */
const VALID_TRANSITIONS: Record<FriendlyStatus, FriendlyStatus[]> = {
  REQUESTED: ['GENERATED', 'CANCELLED'],
  GENERATED: ['PENDING_CONFIRMATION', 'EXPIRED', 'CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED', 'EXPIRED', 'CANCELLED'],
  CONFIRMED: ['PLAYED', 'CANCELLED'],
  PLAYED: ['OBSERVED_FOR_CATEGORIZATION'],
  OBSERVED_FOR_CATEGORIZATION: [],
  EXPIRED: [],
  CANCELLED: [],
};

const TERMINAL_STATUSES: ReadonlySet<FriendlyStatus> = new Set([
  'OBSERVED_FOR_CATEGORIZATION',
  'EXPIRED',
  'CANCELLED',
]);

const CANCELLABLE_STATUSES: ReadonlySet<FriendlyStatus> = new Set([
  'REQUESTED',
  'GENERATED',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
]);

export function listAllowedTransitions(
  from: FriendlyStatus,
): readonly FriendlyStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function isValidTransition(
  from: FriendlyStatus,
  to: FriendlyStatus,
): boolean {
  if (from === to) return false;
  return listAllowedTransitions(from).includes(to);
}

export function isTerminalStatus(status: FriendlyStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Indica si un amistoso puede cancelarse desde su estado actual.
 *
 * Si `playedMatchExists` es true (CONFIRMED + match jugado), no se permite
 * cancelar — usar este flag para distinguir CONFIRMED-pendiente vs CONFIRMED-jugado.
 */
export function canCancelFromStatus(
  status: FriendlyStatus,
  playedMatchExists = false,
): boolean {
  if (status === 'CONFIRMED' && playedMatchExists) {
    return false;
  }
  return CANCELLABLE_STATUSES.has(status);
}

/**
 * Indica si la ventana de confirmación de 24hs ya venció (RN-023).
 * Aplica a estados GENERATED y PENDING_CONFIRMATION (con seña parcial).
 */
export function isDepositWindowExpired(
  deadline: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!deadline) return false;
  return deadline.getTime() <= now.getTime();
}
