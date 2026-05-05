import { BlacklistEntry } from '@prisma/client';

export interface CreateBlacklistInput {
  documentNumber: string;
  profileId?: string | null;
  profileNameSnapshot: string;
  reason: string;
  attachmentUrls?: string[];
  blockedByProfileId: string;
}

export interface ListBlacklistFilter {
  status?: 'ACTIVE' | 'LIFTED';
  profileId?: string;
  documentNumber?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListBlacklistResult {
  data: BlacklistEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface LiftBlacklistInput {
  id: string;
  liftedByProfileId: string;
  resolutionNotes?: string;
}

export interface IBlacklistRepository {
  create(input: CreateBlacklistInput): Promise<BlacklistEntry>;
  findById(id: string): Promise<BlacklistEntry | null>;
  list(filter: ListBlacklistFilter): Promise<ListBlacklistResult>;
  lift(input: LiftBlacklistInput): Promise<BlacklistEntry>;

  /** True si ya existe entrada activa para profileId o documentNumber. */
  hasActiveEntry(params: {
    profileId?: string;
    documentNumber?: string;
  }): Promise<boolean>;

  /** Lista las activas (filtra por profileId o documentNumber). */
  findActive(params: {
    profileId?: string;
    documentNumber?: string;
  }): Promise<BlacklistEntry[]>;

  /** Útil para deactivar memberships del profile al crear entrada. */
  deactivateProfileMemberships(profileId: string): Promise<void>;
}

export const BLACKLIST_REPOSITORY = Symbol('BLACKLIST_REPOSITORY');
