/**
 * Port mínimo de lookup de torneo, consumido por los use-cases de pricing.
 *
 * Se mantiene local al módulo `Pricing` para no acoplar contra el repositorio
 * completo de tournaments. Implementación concreta vive en
 * `infrastructure/repositories/`.
 */

export interface TournamentLookupRecord {
  id: string;
}

export interface ITournamentLookupPort {
  exists(tournamentId: string): Promise<boolean>;
}

export const TOURNAMENT_LOOKUP_PORT = Symbol('TOURNAMENT_LOOKUP_PORT');
