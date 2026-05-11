import type { CategorySubstatus } from '@prisma/client';
import type {
  PaginationDto,
  RegistrationRosterPlayerDto,
} from '@overtime-mono/shared';

export const REGISTRATION_REPOSITORY = Symbol('REGISTRATION_REPOSITORY');

export interface RegistrationTeamRecord {
  id: string;
  name: string;
  sportId: string;
}

export interface RegistrationTournamentRecord {
  id: string;
  name: string;
  status: string;
  registrationStartDate: Date | null;
  registrationEndDate: Date | null;
}

export interface RegistrationCategoryRecord {
  id: string;
  tournamentId: string;
  name: string;
  tournament: {
    sportId: string;
  };
}

export interface RegistrationRosterEntrySummary {
  profileId: string;
  type: 'INITIAL' | 'ADDITION';
}

export interface RegistrationCategorySummary {
  id: string;
  name: string;
  substatus: CategorySubstatus | null;
}

export interface RegistrationEditableRecord {
  id: string;
  teamId: string;
  tournamentId: string;
  categoryId: string;
  status: string;
  category: RegistrationCategorySummary;
  rosterEntries: RegistrationRosterEntrySummary[];
}

export interface RegistrationResolvedPlayer {
  profileId: string;
  name: string;
  documentNumber: string | null;
}

export interface RegistrationConflictEntry {
  profileId: string;
  registration: {
    id: string;
    teamId: string;
    categoryId: string;
  };
}

export interface RegistrationDetailRecord {
  id: string;
  teamId: string;
  tournamentId: string;
  categoryId: string;
  status: string;
  category: RegistrationCategorySummary;
  rosterEntries: Array<
    RegistrationRosterEntrySummary & {
      [key: string]: unknown;
    }
  >;
  [key: string]: unknown;
}

export interface RegistrationsListResult {
  data: Array<Record<string, unknown>>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RegistrationRepository {
  findTeamById(teamId: string): Promise<RegistrationTeamRecord | null>;
  findTournamentById(
    tournamentId: string,
  ): Promise<RegistrationTournamentRecord | null>;
  findCategoryById(
    categoryId: string,
  ): Promise<RegistrationCategoryRecord | null>;
  findExistingActiveRegistration(
    teamId: string,
    tournamentId: string,
  ): Promise<{ categoryId: string } | null>;
  findDetailById(id: string): Promise<RegistrationDetailRecord | null>;
  findEditableById(id: string): Promise<RegistrationEditableRecord | null>;
  list(
    paginationDto: PaginationDto,
    filters?: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ): Promise<RegistrationsListResult>;
  createPendingRegistration(params: {
    teamId: string;
    tournamentId: string;
    categoryId: string;
    requestedBy: string;
    players: RegistrationResolvedPlayer[];
  }): Promise<RegistrationDetailRecord>;
  addRosterEntry(params: {
    registrationId: string;
    teamId: string;
    profileId: string;
    addedBy: string;
  }): Promise<void>;
  findRosterConflicts(params: {
    profileIds: string[];
    tournamentId: string;
    categoryId: string;
    teamId: string;
    excludeRegistrationId?: string;
  }): Promise<RegistrationConflictEntry[]>;
  countScheduledRegularMatches(params: {
    teamId: string;
    categoryId: string;
  }): Promise<number>;
  countRemainingRegularMatches(params: {
    teamId: string;
    categoryId: string;
    statuses: string[];
  }): Promise<number>;
  approveRegistration(
    id: string,
    approvedBy: string,
  ): Promise<RegistrationDetailRecord>;
  rejectRegistration(params: {
    id: string;
    approvedBy: string;
    rejectionReason: string;
  }): Promise<RegistrationDetailRecord>;
  deleteRegistration(id: string): Promise<void>;
}

