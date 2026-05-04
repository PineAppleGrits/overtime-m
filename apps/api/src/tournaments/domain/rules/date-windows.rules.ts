/**
 * Reglas puras de validación de ventanas de fechas del torneo (RN-046).
 *
 * Un torneo declara tres pares de fechas:
 *   - startDate / endDate                       (vigencia del torneo)
 *   - registrationStartDate / registrationEndDate (apertura/cierre de inscripción)
 *   - teamOperationsOpenAt / teamOperationsCloseAt (operaciones del equipo)
 *
 * En todos los pares se exige `start <= end`.
 */

export interface DateWindow {
  start?: Date | string | null;
  end?: Date | string | null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function isValidWindow(window: DateWindow): boolean {
  const start = toDate(window.start);
  const end = toDate(window.end);
  if (!start || !end) return true;
  return start.getTime() <= end.getTime();
}

export interface TournamentWindowsInput {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  registrationStartDate?: Date | string | null;
  registrationEndDate?: Date | string | null;
  teamOperationsOpenAt?: Date | string | null;
  teamOperationsCloseAt?: Date | string | null;
}

export interface InvalidWindow {
  field: 'tournament' | 'registration' | 'teamOperations';
  message: string;
}

export function validateTournamentWindows(
  input: TournamentWindowsInput,
): InvalidWindow | null {
  if (
    !isValidWindow({ start: input.startDate, end: input.endDate })
  ) {
    return {
      field: 'tournament',
      message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    };
  }
  if (
    !isValidWindow({
      start: input.registrationStartDate,
      end: input.registrationEndDate,
    })
  ) {
    return {
      field: 'registration',
      message:
        'La apertura de inscripción debe ser anterior al cierre de inscripción',
    };
  }
  if (
    !isValidWindow({
      start: input.teamOperationsOpenAt,
      end: input.teamOperationsCloseAt,
    })
  ) {
    return {
      field: 'teamOperations',
      message:
        'La apertura operativa debe ser anterior al cierre operativo',
    };
  }
  return null;
}
