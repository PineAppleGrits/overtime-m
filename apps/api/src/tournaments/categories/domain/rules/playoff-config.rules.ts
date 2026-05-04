import { CategorySubstatus, PlayoffFormat } from '@prisma/client';

/**
 * Reglas puras de validación para la configuración de playoffs por categoría.
 *
 * - RN-045: cantidad de zonas (DP-003: máximo 2 en v1).
 * - RN-047: formato BO1/BO3/BO5 por ronda; editable hasta el inicio de los
 *   playoffs (substatus !== PLAYOFFS_FASE).
 * - DP-014: `playIn` opcional, configurable por categoría.
 *
 * Sin dependencias de Nest ni de Prisma — funciones puras, fácilmente testeables.
 */

/** Rondas válidas dentro del JSON `playoffFormatByRound`. */
export const PLAYOFF_ROUNDS = [
  'playIn',
  'quarterfinal',
  'semifinal',
  'final',
  'thirdPlace',
] as const;
export type PlayoffRoundKey = (typeof PLAYOFF_ROUNDS)[number];

/** Formatos válidos por ronda (RN-047 + DP-004). */
export const PLAYOFF_FORMATS: ReadonlyArray<PlayoffFormat> = [
  PlayoffFormat.BO1,
  PlayoffFormat.BO3,
  PlayoffFormat.BO5,
];

/**
 * DP-003: en v1, máximo 2 zonas por categoría.
 */
export const MAX_ZONES_PER_CATEGORY = 2;

/**
 * Estructura del JSON `Category.playoffFormatByRound`.
 *
 * Todas las rondas son opcionales — la categoría puede configurar solo
 * las rondas que efectivamente jueguen (ej. sin `playIn` ni `thirdPlace`).
 * Sin embargo, si una clave existe, debe traer un formato válido.
 */
export type PlayoffFormatByRound = Partial<
  Record<PlayoffRoundKey, PlayoffFormat>
>;

/**
 * RN-045 + DP-003: validar cantidad de zonas.
 *
 * Retorna `null` si es válido o un mensaje de error en español.
 */
export function validateZonesCount(zonesCount: number): string | null {
  if (!Number.isInteger(zonesCount)) {
    return 'La cantidad de zonas debe ser un número entero.';
  }
  if (zonesCount < 1) {
    return 'La cantidad de zonas debe ser al menos 1.';
  }
  if (zonesCount > MAX_ZONES_PER_CATEGORY) {
    return `La cantidad máxima de zonas por categoría es ${MAX_ZONES_PER_CATEGORY} (DP-003).`;
  }
  return null;
}

/**
 * RN-047 — validar el JSON `playoffFormatByRound`.
 *
 * Reglas:
 * - Debe ser un objeto plano (no array, no null).
 * - Solo se aceptan claves de `PLAYOFF_ROUNDS`.
 * - Si una clave aparece, su valor debe ser `'BO1' | 'BO3' | 'BO5'`.
 * - Permitido el objeto vacío (significa "usar default del deporte").
 *
 * Retorna `null` si es válido o un mensaje de error en español.
 */
export function validatePlayoffFormatJson(
  json: unknown,
): string | null {
  if (json === null || json === undefined) return null;
  if (typeof json !== 'object' || Array.isArray(json)) {
    return 'El formato de playoffs debe ser un objeto.';
  }

  const validRoundSet = new Set<string>(PLAYOFF_ROUNDS);
  const validFormatSet = new Set<string>(PLAYOFF_FORMATS);

  for (const [round, format] of Object.entries(json as Record<string, unknown>)) {
    if (!validRoundSet.has(round)) {
      return `Ronda desconocida en el formato de playoffs: "${round}". Válidas: ${PLAYOFF_ROUNDS.join(
        ', ',
      )}.`;
    }
    if (typeof format !== 'string' || !validFormatSet.has(format)) {
      return `Formato inválido para "${round}": "${String(
        format,
      )}". Válidos: ${PLAYOFF_FORMATS.join(', ')}.`;
    }
  }

  return null;
}

/**
 * RN-047 — la configuración de playoffs solo es editable mientras
 * `substatus !== PLAYOFFS_FASE`. Una vez iniciados los playoffs, queda congelada.
 */
export function isPlayoffConfigEditable(
  substatus: CategorySubstatus | null | undefined,
): boolean {
  return substatus !== CategorySubstatus.PLAYOFFS_FASE;
}

/**
 * Mergeo defensivo: combina los defaults del deporte con la config persistida
 * (la config persistida pisa al default cuando coincide la ronda).
 *
 * Solo lectura — no muta los argumentos.
 */
export function mergePlayoffFormatWithDefaults(
  persisted: PlayoffFormatByRound | null | undefined,
  defaults: Record<PlayoffRoundKey, PlayoffFormat>,
): Record<PlayoffRoundKey, PlayoffFormat> {
  return {
    playIn: persisted?.playIn ?? defaults.playIn,
    quarterfinal: persisted?.quarterfinal ?? defaults.quarterfinal,
    semifinal: persisted?.semifinal ?? defaults.semifinal,
    final: persisted?.final ?? defaults.final,
    thirdPlace: persisted?.thirdPlace ?? defaults.thirdPlace,
  };
}
