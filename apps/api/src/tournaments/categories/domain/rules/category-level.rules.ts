/**
 * Reglas puras para asociar `CategoryLevel` a una categoría.
 *
 * RN-044 — categorización: cuando se vincula un `CategoryLevel` a una
 * categoría, el deporte del level debe coincidir con el deporte del torneo
 * parent. Sin esta validación se podría linkear un nivel de "Fútbol C" a
 * una categoría de un torneo de básquet.
 */
export interface SportRef {
  sportId: string;
}

/**
 * Valida que el `CategoryLevel` pertenezca al mismo deporte que el torneo.
 * Retorna `null` si es válido, mensaje en español si no.
 */
export function validateCategoryLevelSportMatches(
  level: SportRef,
  tournament: SportRef,
): string | null {
  if (level.sportId !== tournament.sportId) {
    return 'El nivel de categoría no pertenece al mismo deporte que el torneo.';
  }
  return null;
}
