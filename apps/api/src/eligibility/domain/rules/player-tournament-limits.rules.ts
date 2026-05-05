/**
 * RN-007 / RN-038 — Límites de participación por torneo.
 *
 * - RN-007: Un jugador NO puede estar en dos equipos de la misma categoría.
 * - RN-038: Un jugador puede estar como mucho en 2 equipos por torneo, en
 *   categorías distintas. RN-006 aclara que NO hay tope global de equipos.
 *
 * Funciones puras: reciben el listado de inscripciones activas del jugador
 * en el torneo y deciden si la propuesta nueva (`teamId` + `categoryId`)
 * cumple las reglas.
 */

export interface RegistrationMembershipLike {
  registrationId: string;
  teamId: string;
  categoryId: string;
}

export interface ProposedMembership {
  /** Equipo al que se quiere sumar al jugador. */
  teamId: string;
  /** Categoría del torneo donde se quiere sumar. */
  categoryId: string;
}

export type LimitViolation =
  | { kind: 'CATEGORY_DUPLICATE'; conflictingTeamId: string }
  | { kind: 'TOURNAMENT_LIMIT_EXCEEDED'; teamCount: number };

/**
 * Devuelve la primera violación (o null si no hay).
 */
export function checkPlayerTournamentLimits(
  existing: RegistrationMembershipLike[],
  proposed: ProposedMembership,
): LimitViolation | null {
  // RN-007 — misma categoría, distinto equipo.
  const sameCategoryConflict = existing.find(
    (entry) =>
      entry.categoryId === proposed.categoryId &&
      entry.teamId !== proposed.teamId,
  );
  if (sameCategoryConflict) {
    return {
      kind: 'CATEGORY_DUPLICATE',
      conflictingTeamId: sameCategoryConflict.teamId,
    };
  }

  // RN-038 — más de 2 equipos distintos en el torneo.
  const teamIds = new Set(existing.map((entry) => entry.teamId));
  if (teamIds.has(proposed.teamId)) {
    // ya está en este equipo, no agrega cardinal.
    return null;
  }
  if (teamIds.size >= 2) {
    return { kind: 'TOURNAMENT_LIMIT_EXCEEDED', teamCount: teamIds.size };
  }

  return null;
}

/**
 * Variante read-only que solo evalúa sobre el set actual (sin proposed).
 * Útil para chequear si el jugador YA está sobre el límite.
 */
export function isAlreadyOverLimit(
  existing: RegistrationMembershipLike[],
): boolean {
  const teamIds = new Set(existing.map((entry) => entry.teamId));
  if (teamIds.size > 2) return true;
  // Detección de duplicado en categoría (una misma categoría con dos team ids
  // diferentes para el mismo profile).
  const seenCategoriesByTeam = new Map<string, string>();
  for (const entry of existing) {
    const previousTeam = seenCategoriesByTeam.get(entry.categoryId);
    if (previousTeam && previousTeam !== entry.teamId) {
      return true;
    }
    seenCategoriesByTeam.set(entry.categoryId, entry.teamId);
  }
  return false;
}
