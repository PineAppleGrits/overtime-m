import type { TeamTournamentOperationsRecord } from './team-repository.port';

export const TEAM_TOURNAMENT_CONTEXT_PORT = Symbol(
  'TEAM_TOURNAMENT_CONTEXT_PORT',
);

export interface TeamTournamentContextPort {
  findTournamentForOperations(
    tournamentId: string,
  ): Promise<TeamTournamentOperationsRecord | null>;
}

