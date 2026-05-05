import { Sanction, SanctionProps } from '../../domain/entities/sanction.entity';

export interface CreateSanctionInput {
  targetType: 'PROFILE' | 'TEAM';
  targetProfileId?: string;
  targetTeamId?: string;
  kind: 'DISCIPLINARY' | 'MONETARY';
  reason: string;
  notes?: string;
  attachmentUrls?: string[];
  matchId?: string;
  tournamentId?: string;
  categoryId?: string;
  startsAt?: Date;
  endsAt?: Date;
  amount?: number;
  currency?: string;
  createdByProfileId: string;
  /** Total de fechas — si se setea, embebe el contador inicial en notes. */
  totalFechas?: number;
}

export interface ListSanctionsFilter {
  status?: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED';
  kind?: 'DISCIPLINARY' | 'MONETARY';
  targetType?: 'PROFILE' | 'TEAM';
  targetProfileId?: string;
  targetTeamId?: string;
  matchId?: string;
  tournamentId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListSanctionsResult {
  data: Sanction[];
  total: number;
  page: number;
  limit: number;
}

export interface ISanctionRepository {
  create(input: CreateSanctionInput): Promise<Sanction>;
  findById(id: string): Promise<Sanction | null>;
  list(filter: ListSanctionsFilter): Promise<ListSanctionsResult>;
  save(sanction: Sanction): Promise<Sanction>;

  /** Sanciones activas del profile (kind=DISCIPLINARY o no). */
  findActiveForProfile(profileId: string): Promise<Sanction[]>;
  /** Sanciones activas del team. */
  findActiveForTeam(teamId: string): Promise<Sanction[]>;

  /** Suma `attachmentUrl` al `attachmentUrls[]`. */
  addAttachmentUrl(sanctionId: string, url: string): Promise<Sanction>;
}

export const SANCTION_REPOSITORY = Symbol('SANCTION_REPOSITORY');
