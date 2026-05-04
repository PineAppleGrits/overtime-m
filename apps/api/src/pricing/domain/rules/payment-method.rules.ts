/**
 * RN-048 — método de pago como dimensión adicional del pricing.
 *
 * Como NO podemos modificar el schema Prisma (PR0 cerrado), encodamos
 * el método de pago dentro del campo `currency` con la convención:
 *
 *   - `"ARS"`            → aplica a todos los métodos (default).
 *   - `"ARS:cash"`       → solo efectivo.
 *   - `"ARS:transfer"`   → solo transferencia.
 *   - `"ARS:card"`       → solo tarjeta.
 *
 * El repositorio de pricing es responsable de codificar/decodificar
 * de forma transparente; los use-cases trabajan con el VO `PricingDimension`.
 *
 * TODO: schema-v2 — paymentMethod columnar (mover a una columna `paymentMethod`
 * dedicada cuando se abra una migración Prisma).
 */

export const PAYMENT_METHODS = ['cash', 'transfer', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CURRENCY_METHOD_SEPARATOR = ':';

export interface DecodedCurrency {
  /** ISO 4217 (ej. ARS, USD). */
  currency: string;
  /** `null` cuando aplica a todos los métodos. */
  paymentMethod: PaymentMethod | null;
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === 'string' &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

/**
 * Codifica `(currency, paymentMethod)` en el formato persistido.
 * - `paymentMethod=null` → solo currency (`"ARS"`).
 * - Caso contrario → `"ARS:cash"`.
 */
export function encodeCurrency(
  currency: string,
  paymentMethod: PaymentMethod | null,
): string {
  const ccy = currency.trim().toUpperCase();
  if (!paymentMethod) return ccy;
  return `${ccy}${CURRENCY_METHOD_SEPARATOR}${paymentMethod}`;
}

/**
 * Decodifica el `currency` persistido. Si el sufijo no es un método válido,
 * lo descarta (legacy data). El `currency` se uppercases.
 */
export function decodeCurrency(persisted: string): DecodedCurrency {
  const idx = persisted.indexOf(CURRENCY_METHOD_SEPARATOR);
  if (idx < 0) {
    return { currency: persisted.trim().toUpperCase(), paymentMethod: null };
  }
  const currency = persisted.slice(0, idx).trim().toUpperCase();
  const suffix = persisted.slice(idx + 1).trim().toLowerCase();
  return {
    currency,
    paymentMethod: isPaymentMethod(suffix) ? suffix : null,
  };
}

/**
 * Reglas de overlap por método:
 * - Dos períodos con métodos distintos NO se solapan en términos de configuración.
 * - Un período con `method=null` actúa como "fallback" para todos los métodos:
 *   solapa con cualquier otro (null o específico).
 * - Dos períodos con el mismo método específico solapan si sus rangos solapan.
 */
export function methodsOverlap(
  a: PaymentMethod | null,
  b: PaymentMethod | null,
): boolean {
  if (a === null || b === null) return true;
  return a === b;
}
