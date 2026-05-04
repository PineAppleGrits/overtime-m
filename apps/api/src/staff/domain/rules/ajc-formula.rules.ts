/**
 * RN-030 — AJC: habilitación anticipada del jugador suspendido por pago.
 *
 * Fórmula:
 *   AJC = sueldo del árbitro por partido × cantidad de fechas a liberar
 *
 * Función pura, sin dependencias.
 */
export function computeAjcFee(
  refereeSalary: number,
  fechasToFree: number,
): number {
  if (!Number.isFinite(refereeSalary) || refereeSalary <= 0) {
    throw new Error('refereeSalary debe ser un número > 0');
  }
  if (!Number.isInteger(fechasToFree) || fechasToFree <= 0) {
    throw new Error('fechasToFree debe ser un entero > 0');
  }
  return refereeSalary * fechasToFree;
}
