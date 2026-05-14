import { PlayoffFormat, Tournament } from '@prisma/client';
import { TournamentStatus } from '@overtime-mono/shared';

/**
 * Estructura mínima del torneo persistido. Reutiliza el tipo Prisma
 * para no duplicar shape; la persistencia concreta vive en
 * `infrastructure/repositories/`.
 */
export type TournamentRecord = Tournament;

export interface CreateTournamentInput {
  name: string;
  slug: string;
  description?: string | null;
  sportId: string;
  status: TournamentStatus;
  fixtureFormat?: 'SINGLE_ROUND' | 'DOUBLE_ROUND' | null;
  modality?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  registrationStartDate?: Date | null;
  registrationEndDate?: Date | null;
  teamOperationsOpenAt?: Date | null;
  teamOperationsCloseAt?: Date | null;
  insurancePerPlayer?: number | null;
  promotionPlayoffFormat?: PlayoffFormat;
  earlyCancellationThresholdHours?: number | null;
}

export interface UpdateTournamentInput {
  name?: string;
  slug?: string;
  description?: string | null;
  sportId?: string;
  status?: TournamentStatus;
  fixtureFormat?: 'SINGLE_ROUND' | 'DOUBLE_ROUND';
  modality?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  registrationStartDate?: Date | null;
  registrationEndDate?: Date | null;
  teamOperationsOpenAt?: Date | null;
  teamOperationsCloseAt?: Date | null;
  insurancePerPlayer?: number | null;
  promotionPlayoffFormat?: PlayoffFormat;
  earlyCancellationThresholdHours?: number | null;
}

export interface SlugExistsCheckArgs {
  slug: string;
  excludeId?: string;
}

/**
 * Port del repositorio de torneos. Las implementaciones concretas viven en
 * `infrastructure/repositories/`. Los use-cases dependen sólo de esta interfaz.
 */
export interface ITournamentRepository {
  slugExists(args: SlugExistsCheckArgs): Promise<boolean>;
  findBySportId(sportId: string): Promise<{ id: string } | null>;
  findById(id: string): Promise<TournamentRecord | null>;
  findBySlug(slug: string): Promise<TournamentRecord | null>;
  create(input: CreateTournamentInput): Promise<TournamentRecord>;
  update(id: string, input: UpdateTournamentInput): Promise<TournamentRecord>;
  updateStatus(
    id: string,
    status: TournamentStatus,
  ): Promise<TournamentRecord>;
  /** Cantidad de categorías no eliminadas del torneo. */
  countCategories(tournamentId: string): Promise<number>;
  /** IDs de categorías del torneo que NO tienen aún partidos generados (fixture pendiente). */
  findCategoriesWithoutFixture(
    tournamentId: string,
  ): Promise<Array<{ id: string; name: string }>>;
}

export const TOURNAMENT_REPOSITORY = Symbol('TOURNAMENT_REPOSITORY');
