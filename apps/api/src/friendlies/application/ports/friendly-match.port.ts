/**
 * Port para crear el Match resultante cuando un amistoso se confirma
 * (ambas señas pagas). Implementación toca Prisma.match directo.
 */

export interface CreateFriendlyMatchInput {
  friendlyId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: Date;
  venueId?: string | null;
}

export interface IFriendlyMatchService {
  createFriendlyMatch(input: CreateFriendlyMatchInput): Promise<{ id: string }>;
}

export const FRIENDLY_MATCH_SERVICE = Symbol('FRIENDLY_MATCH_SERVICE');
