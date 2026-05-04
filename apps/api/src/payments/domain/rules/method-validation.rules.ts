/**
 * Reglas puras sobre el método de pago (`Payment.method`).
 *
 * Decisión: `Payment.method` es un string libre en el schema; aquí lo restringimos
 * a la lista cerrada que conoce la aplicación.
 *
 * Métodos:
 *   - `mercadopago`    — checkout vía MP, status lo maneja el webhook.
 *   - `cash`           — efectivo, requiere `markAsPaid` admin.
 *   - `transferencia`  — transferencia bancaria, requiere comprobante (RN-014) y
 *                        admin lo aprueba con `markAsPaid`. Comprobante se borra
 *                        a los 3 días (RN-060).
 *   - `transfer`       — alias legacy del FE (acepta ambos).
 *   - `other`          — otros (ej. compensación).
 */
export type PaymentMethodValue =
  | 'mercadopago'
  | 'cash'
  | 'transferencia'
  | 'transfer'
  | 'other';

const VALID_METHODS: ReadonlySet<PaymentMethodValue> = new Set([
  'mercadopago',
  'cash',
  'transferencia',
  'transfer',
  'other',
]);

const PROOF_REQUIRED_METHODS: ReadonlySet<PaymentMethodValue> = new Set([
  'transferencia',
  'transfer',
]);

const ADMIN_MARK_REQUIRED_METHODS: ReadonlySet<PaymentMethodValue> = new Set([
  'cash',
  'transferencia',
  'transfer',
  'other',
]);

const AUTO_DELETE_PROOF_METHODS: ReadonlySet<PaymentMethodValue> = new Set([
  'transferencia',
  'transfer',
]);

export function isValidPaymentMethod(method: string): method is PaymentMethodValue {
  return VALID_METHODS.has(method as PaymentMethodValue);
}

/**
 * RN-014 — ¿Este método requiere subir comprobante para validarse?
 */
export function requiresProof(method: PaymentMethodValue): boolean {
  return PROOF_REQUIRED_METHODS.has(method);
}

/**
 * ¿Este método debe ser aprobado manualmente por un admin (vs. webhook)?
 */
export function requiresAdminApproval(method: PaymentMethodValue): boolean {
  return ADMIN_MARK_REQUIRED_METHODS.has(method);
}

/**
 * RN-060 — ¿El comprobante de este método se borra automáticamente tras aprobación?
 */
export function shouldAutoDeleteProof(method: PaymentMethodValue): boolean {
  return AUTO_DELETE_PROOF_METHODS.has(method);
}

/**
 * Normaliza alias legacy del FE. `transfer` (en) y `transferencia` (es) son lo
 * mismo en términos de negocio.
 */
export function normalizeMethod(method: PaymentMethodValue): PaymentMethodValue {
  if (method === 'transfer') return 'transferencia';
  return method;
}
