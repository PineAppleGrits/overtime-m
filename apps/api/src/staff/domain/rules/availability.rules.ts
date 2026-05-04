/**
 * Reglas puras de disponibilidad horaria de staff.
 *
 * Decisión de modelado: las franjas se guardan como string `HH:mm` por dayOfWeek
 * (0 = domingo). Convertimos a minutos absolutos para comparar y detectar
 * superposiciones.
 */

/**
 * Convierte un string `HH:mm` a minutos desde medianoche.
 * Lanza si el formato no es válido.
 */
export function timeStringToMinutes(time: string): number {
  const match = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(time);
  if (!match) {
    throw new Error(`Formato de hora inválido: "${time}" (esperado HH:mm)`);
  }
  const [, hh, mm] = match;
  return Number.parseInt(hh, 10) * 60 + Number.parseInt(mm, 10);
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

/**
 * Indica si dos franjas horarias en el mismo día se superponen.
 * Considera "tocarse" sin superponerse: 09:00-10:00 y 10:00-11:00 NO se superponen.
 */
export function timeSlotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  const startA = timeStringToMinutes(a.startTime);
  const endA = timeStringToMinutes(a.endTime);
  const startB = timeStringToMinutes(b.startTime);
  const endB = timeStringToMinutes(b.endTime);
  return startA < endB && endA > startB;
}

/**
 * Indica si una franja `slot` cubre completamente el momento `time` (inclusive).
 * Útil para chequear si un staff con `slot` puede atender un partido a las `time`.
 */
export function slotCoversTime(slot: TimeSlot, time: string): boolean {
  const t = timeStringToMinutes(time);
  const start = timeStringToMinutes(slot.startTime);
  const end = timeStringToMinutes(slot.endTime);
  return t >= start && t <= end;
}

/**
 * Devuelve `null` si la lista de franjas no tiene superposiciones por día,
 * o un mensaje de error indicando dónde se cruzan.
 */
export function validateNoOverlaps(
  slots: Array<TimeSlot & { dayOfWeek: number }>,
): string | null {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].dayOfWeek === slots[j].dayOfWeek) {
        if (timeSlotsOverlap(slots[i], slots[j])) {
          return `Las franjas horarias se superponen en el día ${slots[i].dayOfWeek}`;
        }
      }
    }
  }
  return null;
}
