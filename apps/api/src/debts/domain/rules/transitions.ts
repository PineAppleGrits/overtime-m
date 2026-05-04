import { DebtStatus } from '@prisma/client';

/**
 * Reglas puras de transición de estado de una deuda (RN-031).
 *
 * Transiciones permitidas:
 *
 *   APPROVED            → PARTIALLY_PAID | PAID | DELETED_BY_ERROR | DELETED_WITH_RECORD | CANCELLED
 *   PARTIALLY_PAID      → PAID | CANCELLED
 *   PAID                → (terminal)
 *   DELETED_BY_ERROR    → (terminal)
 *   DELETED_WITH_RECORD → (terminal)
 *   CANCELLED           → (terminal)
 *
 * Notas:
 * - APPROVED → PARTIALLY_PAID y APPROVED|PARTIALLY_PAID → PAID se disparan
 *   automáticamente desde `applyPayment`, no por endpoint admin.
 * - El endpoint admin de cambio de estado (`change-debt-status`) sólo permite
 *   transiciones administrativas: APPROVED → DELETED_BY_ERROR, APPROVED → DELETED_WITH_RECORD,
 *   APPROVED|PARTIALLY_PAID → CANCELLED.
 */
const VALID_TRANSITIONS: Record<DebtStatus, DebtStatus[]> = {
  APPROVED: [
    'PARTIALLY_PAID',
    'PAID',
    'DELETED_BY_ERROR',
    'DELETED_WITH_RECORD',
    'CANCELLED',
  ],
  PARTIALLY_PAID: ['PAID', 'CANCELLED'],
  PAID: [],
  DELETED_BY_ERROR: [],
  DELETED_WITH_RECORD: [],
  CANCELLED: [],
};

/**
 * Subset de transiciones que el admin puede ejecutar manualmente vía
 * `PATCH /debts/:id/status` (RN-031).
 *
 * Las transiciones a `PAID`/`PARTIALLY_PAID` no están aquí porque las
 * dispara el flujo de `applyPayment` automáticamente cuando se cobra.
 */
const ADMIN_ALLOWED_TRANSITIONS: Record<DebtStatus, DebtStatus[]> = {
  APPROVED: ['DELETED_BY_ERROR', 'DELETED_WITH_RECORD', 'CANCELLED'],
  PARTIALLY_PAID: ['CANCELLED'],
  PAID: [],
  DELETED_BY_ERROR: [],
  DELETED_WITH_RECORD: [],
  CANCELLED: [],
};

const TERMINAL_STATUSES: ReadonlySet<DebtStatus> = new Set([
  'PAID',
  'DELETED_BY_ERROR',
  'DELETED_WITH_RECORD',
  'CANCELLED',
]);

/**
 * Estados en los que la deuda sigue siendo exigible (cuenta para bloqueo de
 * partidos via RN-053, genera intereses RN-028, etc.).
 */
const ACTIVE_STATUSES: ReadonlySet<DebtStatus> = new Set([
  'APPROVED',
  'PARTIALLY_PAID',
]);

export function listAllowedTransitions(
  from: DebtStatus,
): readonly DebtStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function listAdminAllowedTransitions(
  from: DebtStatus,
): readonly DebtStatus[] {
  return ADMIN_ALLOWED_TRANSITIONS[from] ?? [];
}

export function isValidTransition(
  from: DebtStatus,
  to: DebtStatus,
): boolean {
  if (from === to) return false;
  return listAllowedTransitions(from).includes(to);
}

export function isAdminAllowedTransition(
  from: DebtStatus,
  to: DebtStatus,
): boolean {
  if (from === to) return false;
  return listAdminAllowedTransitions(from).includes(to);
}

export function isTerminalStatus(status: DebtStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isActiveStatus(status: DebtStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}
