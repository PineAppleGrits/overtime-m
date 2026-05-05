/**
 * RN-003 / RN-030 — Conteo de "fechas cumplidas" para sanciones por fechas.
 *
 * Como el modelo `Sanction` no tiene campo `metadata` jsonb (no podemos modificar
 * el schema), embebemos el contador en el campo `notes` con un marcador
 * estructurado de la forma:
 *
 *   `[FECHAS] total=5 cumplidas=2`
 *
 * Cualquier texto adicional que el admin haya escrito como notas convive con el
 * marcador. Cuando se actualiza el contador, reemplazamos solo la línea del
 * marcador (sin tocar el resto de las notas).
 *
 * Funciones puras — testeables sin Prisma.
 */

export interface FechasState {
  totalFechas: number;
  fechasCumplidas: number;
}

const FECHAS_REGEX = /\[FECHAS\]\s*total=(\d+)\s*cumplidas=(\d+)/i;

/** Lee el estado de fechas desde un campo notes. Devuelve null si no hay marcador. */
export function readFechasState(notes: string | null | undefined): FechasState | null {
  if (!notes) return null;
  const match = FECHAS_REGEX.exec(notes);
  if (!match) return null;
  const total = Number.parseInt(match[1], 10);
  const cumplidas = Number.parseInt(match[2], 10);
  if (!Number.isFinite(total) || !Number.isFinite(cumplidas)) return null;
  return { totalFechas: total, fechasCumplidas: cumplidas };
}

/** Reemplaza (o agrega) el marcador. */
export function writeFechasState(
  notes: string | null | undefined,
  state: FechasState,
): string {
  const stamp = `[FECHAS] total=${state.totalFechas} cumplidas=${state.fechasCumplidas}`;
  if (!notes) return stamp;
  if (FECHAS_REGEX.test(notes)) {
    return notes.replace(FECHAS_REGEX, stamp);
  }
  return `${notes}\n${stamp}`;
}

/**
 * Suma N fechas cumplidas. Devuelve el nuevo estado y un flag `autoResolved`
 * cuando alcanza/excede el total.
 */
export function addFechasCumplidas(
  current: FechasState,
  delta: number,
): { next: FechasState; autoResolved: boolean } {
  const next: FechasState = {
    totalFechas: current.totalFechas,
    fechasCumplidas: Math.min(
      current.totalFechas,
      current.fechasCumplidas + delta,
    ),
  };
  return {
    next,
    autoResolved: next.fechasCumplidas >= current.totalFechas,
  };
}

/**
 * True si la sanción todavía tiene fechas pendientes (necesita seguir bloqueando).
 */
export function hasPendingFechas(state: FechasState | null): boolean {
  if (!state) return false;
  return state.fechasCumplidas < state.totalFechas;
}
