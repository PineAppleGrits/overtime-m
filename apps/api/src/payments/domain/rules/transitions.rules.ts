/**
 * Reglas puras de transición de estado de un Payment.
 *
 * Estados (string en BD por compatibilidad histórica):
 *   - `pendiente`    — recién creado, esperando confirmación.
 *   - `procesando`   — pasarela (MP) lo está procesando.
 *   - `procesado`    — aprobado / pago efectivo (terminal positivo).
 *   - `fallido`      — rechazado / cancelado (terminal negativo).
 *   - `reembolsado`  — devuelto (terminal negativo).
 *
 * Transiciones permitidas:
 *   pendiente   → procesando | procesado | fallido
 *   procesando  → procesado | fallido
 *   procesado   → reembolsado            (refund admin / MP)
 *   fallido     → (terminal — no se vuelve atrás)
 *   reembolsado → (terminal)
 *
 * Convención: el estado `procesado` es el único que dispara
 * `DebtsService.applyPayment` y emite `PAYMENT_APPROVED`.
 */
export type PaymentStatusValue =
  | 'pendiente'
  | 'procesando'
  | 'procesado'
  | 'fallido'
  | 'reembolsado';

const VALID_TRANSITIONS: Record<PaymentStatusValue, PaymentStatusValue[]> = {
  pendiente: ['procesando', 'procesado', 'fallido'],
  procesando: ['procesado', 'fallido'],
  procesado: ['reembolsado'],
  fallido: [],
  reembolsado: [],
};

const TERMINAL_STATUSES: ReadonlySet<PaymentStatusValue> = new Set([
  'procesado',
  'fallido',
  'reembolsado',
]);

const APPROVABLE_STATUSES: ReadonlySet<PaymentStatusValue> = new Set([
  'pendiente',
  'procesando',
]);

export function listAllowedTransitions(
  from: PaymentStatusValue,
): readonly PaymentStatusValue[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function isValidPaymentTransition(
  from: PaymentStatusValue,
  to: PaymentStatusValue,
): boolean {
  if (from === to) return false;
  return listAllowedTransitions(from).includes(to);
}

export function isTerminalPaymentStatus(status: PaymentStatusValue): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * ¿Este estado puede ser aprobado (transición a `procesado`)?
 * Útil para validar antes de invocar `markAsPaid` o procesar webhook.
 */
export function isApprovableStatus(status: PaymentStatusValue): boolean {
  return APPROVABLE_STATUSES.has(status);
}
