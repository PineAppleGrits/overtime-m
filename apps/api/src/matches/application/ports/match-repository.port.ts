import { Prisma } from '@prisma/client';

export const MATCH_REPOSITORY = Symbol('MATCH_REPOSITORY');

/**
 * Match enriquecido con relaciones que más usan los use-cases.
 * Se mantiene laxo para no atar los repos a un schema concreto.
 */
export type MatchRow = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
    category: { include: { tournament: true } };
    zone: true;
    venue: true;
    series: true;
  };
}>;

/**
 * Puerto del repositorio de partidos. La capa de infrastructure provee
 * la implementación con Prisma (PrismaMatchRepository).
 */
export interface IMatchRepository {
  findById(id: string): Promise<MatchRow | null>;
  /** Para start: necesita el sport del torneo para resolver SportRules. */
  findByIdWithSport(id: string): Promise<
    | (MatchRow & {
        category:
          | (NonNullable<MatchRow['category']> & {
              tournament: NonNullable<MatchRow['category']>['tournament'] & {
                sport: { code: string };
              };
            })
          | null;
      })
    | null
  >;
  updateRaw(id: string, data: Prisma.MatchUpdateInput): Promise<MatchRow>;
  countConfirmedStaff(matchId: string): Promise<{
    referees: number;
    tableOfficials: number;
  }>;
  /** Lista los matches de una serie (para advance-on-winner). */
  findBySeriesId(seriesId: string): Promise<MatchRow[]>;
}
