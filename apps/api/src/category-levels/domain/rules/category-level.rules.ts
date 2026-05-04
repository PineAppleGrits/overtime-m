import { CategoryLevel } from '../entities/category-level.entity';

/**
 * Reglas puras de dominio para CategoryLevel.
 */

/** Devuelve el nivel más alto (rank menor). */
export function highestLevel(levels: CategoryLevel[]): CategoryLevel | null {
  if (levels.length === 0) return null;
  return levels.reduce((acc, lvl) =>
    lvl.compareRank(acc) === -1 ? lvl : acc,
  );
}

/** Devuelve el nivel más bajo (rank mayor). */
export function lowestLevel(levels: CategoryLevel[]): CategoryLevel | null {
  if (levels.length === 0) return null;
  return levels.reduce((acc, lvl) =>
    lvl.compareRank(acc) === 1 ? lvl : acc,
  );
}

/** Ordena por rank ascendente (más alto primero). */
export function sortByRankAsc(levels: CategoryLevel[]): CategoryLevel[] {
  return [...levels].sort((a, b) => a.rank - b.rank);
}

/**
 * RN-044 — un equipo puede tener hasta 2 niveles asignados.
 */
export const MAX_LEVELS_PER_TEAM = 2;

/**
 * Valida que un set de codes de niveles cumpla con la regla RN-044.
 * Devuelve un mensaje de error o null si es válido.
 */
export function validateLevelCodesForTeam(
  codes: string[],
): string | null {
  if (codes.length === 0) {
    return 'Debe especificar al menos un nivel';
  }
  if (codes.length > MAX_LEVELS_PER_TEAM) {
    return `Un equipo puede tener hasta ${MAX_LEVELS_PER_TEAM} niveles (RN-044)`;
  }
  const unique = new Set(codes);
  if (unique.size !== codes.length) {
    return 'No se pueden repetir niveles';
  }
  return null;
}

/**
 * Compatibilidad de niveles: ¿alguno de los niveles del equipo coincide con
 * el nivel destino (RN-044)?
 */
export function teamMatchesCategoryLevel(
  teamLevelIds: string[],
  targetCategoryLevelId: string,
): boolean {
  return teamLevelIds.includes(targetCategoryLevelId);
}
