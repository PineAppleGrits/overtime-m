import { Prisma } from '@prisma/client';

export const PLAYOFF_REPOSITORY = Symbol('PLAYOFF_REPOSITORY');

export type PlayoffSeriesRow = Prisma.PlayoffSeriesGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
    winnerTeam: true;
    matchesDirect: true;
    feedsToA: true;
    feedsToB: true;
  };
}>;

export interface IPlayoffRepository {
  findSeriesById(id: string): Promise<PlayoffSeriesRow | null>;
  findSeriesByCategory(categoryId: string): Promise<PlayoffSeriesRow[]>;
  findSeriesFedByCompletedSeries(
    completedSeriesId: string,
  ): Promise<PlayoffSeriesRow[]>;
  /** Marca el winner y status COMPLETED en una serie. */
  markSeriesCompleted(seriesId: string, winnerTeamId: string): Promise<void>;
  setSeriesStatus(seriesId: string, status: string): Promise<void>;
  /** Asigna home/away a una serie (cuando se resuelve la alimentación). */
  assignTeams(
    seriesId: string,
    homeTeamId: string | null,
    awayTeamId: string | null,
    status?: string,
  ): Promise<void>;

  hasPlayoffMatchesStarted(categoryId: string): Promise<boolean>;
  countCompletedRegularMatches(categoryId: string): Promise<{
    finished: number;
    total: number;
  }>;

  /**
   * Crea matches físicos para una serie según `format`.
   */
  createSeriesMatches(input: {
    seriesId: string;
    categoryId: string;
    zoneId: string | null;
    homeTeamId: string;
    awayTeamId: string;
    matchType: string;
    playoffStage: string;
    games: number;
    baseDate: Date;
  }): Promise<void>;

  /**
   * Borra matches de una serie (para casos de override pre-arranque).
   */
  deleteSeriesMatches(seriesId: string): Promise<void>;
}
