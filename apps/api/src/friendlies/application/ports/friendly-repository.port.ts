import { Friendly, FriendlyStatus, Prisma } from '@prisma/client';
import { FriendlyState } from '../../domain/entities/friendly.entity';

/**
 * Tipo enriquecido devuelto por findById/list — incluye debts asociadas
 * (FRIENDLY_DEPOSIT) para que los use-cases puedan inspeccionar el estado
 * de las señas sin un round-trip extra.
 */
export type FriendlyWithDeposits = Friendly & {
  debts: {
    id: string;
    teamId: string | null;
    type: string;
    status: string;
    currentBalance: Prisma.Decimal;
    originAmount: Prisma.Decimal;
  }[];
};

export interface CreateFriendlyInput {
  sportId: string;
  modality: string;
  homeTeamId: string;
  awayTeamId: string;
  proposedDate: Date;
  venueId?: string | null;
  notes?: string | null;
  status: FriendlyStatus;
  createdByProfileId: string;
}

export interface ListFriendliesFilter {
  teamId?: string;
  statuses?: FriendlyStatus[];
  from?: Date;
  to?: Date;
  // Para delegados: filtramos por equipos que son visibles para el usuario.
  visibleTeamIds?: string[];
  page?: number;
  limit?: number;
}

export interface IFriendlyRepository {
  create(input: CreateFriendlyInput): Promise<FriendlyWithDeposits>;
  findById(id: string): Promise<FriendlyWithDeposits | null>;
  list(filter: ListFriendliesFilter): Promise<{
    data: FriendlyWithDeposits[];
    total: number;
  }>;
  findOverduePending(now: Date): Promise<FriendlyWithDeposits[]>;
  /**
   * Persiste el resultado de aplicar una transición/mutación sobre el
   * dominio. Acepta un subset del state (los campos a actualizar).
   */
  updateState(
    id: string,
    patch: Partial<FriendlyState>,
  ): Promise<FriendlyWithDeposits>;
  /**
   * Marca status=CONFIRMED y vincula el resultingMatchId en una sola
   * transacción para evitar estados intermedios inconsistentes.
   */
  confirmWithMatch(
    id: string,
    matchId: string,
  ): Promise<FriendlyWithDeposits>;
}

export const FRIENDLY_REPOSITORY = Symbol('FRIENDLY_REPOSITORY');
