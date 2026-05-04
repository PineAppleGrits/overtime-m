/**
 * Puerto mínimo para consultar info de Match desde Payments (legacy
 * checkout para partidos). Mantiene la independencia del módulo `Matches`.
 */
export interface MatchSummary {
  id: string;
  costPerTeam: number | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
}

export interface IMatchContextPort {
  getById(matchId: string): Promise<MatchSummary | null>;
}

export const MATCH_CONTEXT_PORT = Symbol('MATCH_CONTEXT_PORT');
