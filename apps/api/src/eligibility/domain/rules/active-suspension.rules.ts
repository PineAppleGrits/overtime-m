/**
 * RN-003 — Suspensión activa de un jugador.
 *
 * Funciones puras para evaluar si una sanción "está activa ahora" en un cierto
 * scope (torneo / categoría / partido).
 */

export interface SanctionLike {
  id: string;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED';
  kind: 'DISCIPLINARY' | 'MONETARY';
  matchId: string | null;
  tournamentId: string | null;
  categoryId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
}

export interface SanctionScope {
  matchId?: string;
  tournamentId?: string;
  categoryId?: string;
}

/** True si la sanción está activa al momento `asOfDate`. */
export function isSanctionActiveAt(
  sanction: SanctionLike,
  asOfDate: Date,
): boolean {
  if (sanction.status !== 'ACTIVE') return false;
  if (sanction.startsAt && sanction.startsAt.getTime() > asOfDate.getTime()) {
    return false;
  }
  if (sanction.endsAt && sanction.endsAt.getTime() < asOfDate.getTime()) {
    return false;
  }
  return true;
}

/**
 * Si la sanción tiene scope (matchId/categoryId/tournamentId), bloquea solo
 * cuando el contexto pedido coincide. Si la sanción es global (sin scope),
 * bloquea siempre.
 */
export function sanctionMatchesScope(
  sanction: SanctionLike,
  scope: SanctionScope,
): boolean {
  if (sanction.matchId) {
    if (!scope.matchId) return false;
    return sanction.matchId === scope.matchId;
  }
  if (sanction.categoryId) {
    if (!scope.categoryId) return false;
    return sanction.categoryId === scope.categoryId;
  }
  if (sanction.tournamentId) {
    if (!scope.tournamentId) return false;
    return sanction.tournamentId === scope.tournamentId;
  }
  return true;
}

/**
 * Filtra las sanciones que efectivamente bloquean al sujeto en el scope
 * pedido (activas + dentro del scope).
 */
export function filterBlockingSanctions(
  sanctions: SanctionLike[],
  scope: SanctionScope,
  asOfDate: Date,
): SanctionLike[] {
  return sanctions
    .filter((sanction) => isSanctionActiveAt(sanction, asOfDate))
    .filter((sanction) => sanctionMatchesScope(sanction, scope));
}
