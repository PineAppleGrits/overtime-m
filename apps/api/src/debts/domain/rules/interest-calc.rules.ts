import { DebtType } from '@prisma/client';

/**
 * Reglas puras para el cómputo de intereses y cargos diarios sobre deudas
 * vencidas (RN-028, RN-029).
 *
 * - Cada día vencido genera **un cargo independiente** (Debt hija) con
 *   `parentDebtId` apuntando a la deuda madre.
 * - El monto se lee al momento de emitir; los cargos ya emitidos NO se
 *   recalculan si el fee cambia (RN-028 explícita: "agnóstico a futuros
 *   cambios del fee").
 * - Idempotencia: cada cargo guarda `metadata.dayKey = YYYY-MM-DD` para
 *   evitar duplicados si el cron corre dos veces el mismo día.
 *
 * Defaults:
 * - Monto referencial $5.000/día (RN-028, RN-029).
 * - TODO: leer de un parámetro configurable global cuando se cierre el RN
 *   de tarifas (RN-021 lo cubre como "tarifas configurables").
 */

/**
 * Monto diario por defecto cuando no se pudo resolver del torneo asociado.
 * Referencia: RN-028 / RN-029 — $5.000/día.
 */
export const DEFAULT_OVERDUE_DAILY_AMOUNT = 5000;

/**
 * Tipos de deuda que generan **OVERDUE_INTEREST** al vencer (RN-028).
 * Aplica a cargos administrativos / multas / intereses previos.
 *
 * Excluye los tipos que ya tienen su propio cargo diario (REGISTRATION_FEE,
 * INSURANCE) — esos van por LATE_PAYMENT_DAILY_CHARGE (RN-029).
 *
 * Nota: en la spec original RN-028 deja "confirmar si aplica solo a multas o
 * también a otros conceptos vencidos". Por ahora aplicamos a TODAS las deudas
 * exigibles que no sean REGISTRATION_FEE/INSURANCE, para no perder ingresos
 * de multas e intereses previos.
 */
export function debtTypeAccruesOverdueInterest(type: DebtType): boolean {
  switch (type) {
    case 'REGISTRATION_FEE':
    case 'INSURANCE':
      // Estas usan el cargo diario por arancel atrasado (RN-029).
      return false;
    case 'OVERDUE_INTEREST':
    case 'LATE_PAYMENT_DAILY_CHARGE':
      // Los cargos diarios mismos no acumulan más intereses sobre sí mismos.
      return false;
    default:
      return true;
  }
}

/**
 * Tipos de deuda que generan **LATE_PAYMENT_DAILY_CHARGE** al vencer (RN-029).
 * Aplica a inscripción y seguros (cuotas con fecha límite "lunes posterior al
 * fin de semana de juego").
 */
export function debtTypeAccruesLatePaymentCharge(type: DebtType): boolean {
  return type === 'REGISTRATION_FEE' || type === 'INSURANCE';
}

/**
 * Convierte una fecha a la clave YYYY-MM-DD usada para idempotencia diaria.
 * Trabaja en UTC para no depender del TZ del runtime.
 */
export function toDayKey(date: Date): string {
  const yyyy = date.getUTCFullYear().toString().padStart(4, '0');
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = date.getUTCDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Devuelve el inicio del día (UTC) para la fecha dada — útil para queries
 * "dueDate < startOfToday" que detectan deudas vencidas.
 */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

export interface InterestChargeDescriptor {
  type: DebtType; // OVERDUE_INTEREST | LATE_PAYMENT_DAILY_CHARGE
  concept: string;
  dayKey: string;
}

/**
 * Construye el descriptor (concept + dayKey) del cargo diario sobre una
 * deuda vencida. RN-028 exige una descripción que identifique la deuda y
 * la fecha del cargo.
 */
export function buildInterestChargeDescriptor(params: {
  parentDebtId: string;
  parentConcept: string;
  date: Date;
  chargeType: 'OVERDUE_INTEREST' | 'LATE_PAYMENT_DAILY_CHARGE';
}): InterestChargeDescriptor {
  const dayKey = toDayKey(params.date);
  const concept =
    params.chargeType === 'OVERDUE_INTEREST'
      ? `Interés por día vencido — deuda #${params.parentDebtId} — fecha ${dayKey}`
      : `Arancel por pago fuera de fecha — deuda #${params.parentDebtId} — fecha ${dayKey}`;
  return {
    type: params.chargeType,
    concept,
    dayKey,
  };
}
