/**
 * Reglas puras de dominio para la categorización de equipos (RN-039, RN-044).
 */

export const MAX_LEVELS_PER_TEAM = 2;

/**
 * RN-044 — un equipo puede tener hasta 2 niveles asignados.
 *
 * Devuelve un mensaje en español si el set propuesto rompe alguna regla,
 * o `null` si es válido.
 */
export function validateProposedLevelCodes(codes: string[]): string | null {
  if (codes.length === 0) {
    return 'Debe especificar al menos un nivel';
  }
  if (codes.length > MAX_LEVELS_PER_TEAM) {
    return `Un equipo puede tener hasta ${MAX_LEVELS_PER_TEAM} niveles (RN-044)`;
  }
  const unique = new Set(codes.map((c) => c.toUpperCase().trim()));
  if (unique.size !== codes.length) {
    return 'No se pueden repetir niveles';
  }
  return null;
}

/**
 * Valida que asignar nuevos niveles (sin reemplazar) no exceda el máximo.
 * `currentCount` = niveles actuales del equipo, `proposedCount` = los nuevos
 * que se intenta asignar.
 */
export function canAddLevelsWithoutReplacing(
  currentCount: number,
  proposedCount: number,
): boolean {
  return currentCount + proposedCount <= MAX_LEVELS_PER_TEAM;
}

/**
 * RN-039 — un equipo está categorizado si tiene al menos 1 nivel asignado.
 */
export function isTeamCategorized(levelCount: number): boolean {
  return levelCount > 0;
}

/**
 * RN-044 — un equipo es elegible para una categoría destino si su set de
 * niveles incluye el `categoryLevelId` de la categoría.
 *
 * Si la categoría destino no tiene `categoryLevelId` configurado, no aplicamos
 * la restricción (el admin puede no haber configurado niveles para esa categoría).
 */
export function isTeamEligibleForCategory(
  teamLevelIds: string[],
  targetCategoryLevelId: string | null,
): boolean {
  if (targetCategoryLevelId === null) {
    return true;
  }
  return teamLevelIds.includes(targetCategoryLevelId);
}
