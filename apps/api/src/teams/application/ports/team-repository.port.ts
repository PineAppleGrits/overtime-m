import type { DebtStatus, DebtType } from '@prisma/client';
import type { PaginationSchemaDto } from '@overtime-mono/shared';

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');

export interface TeamCreatorProfileRecord {
  id: string;
  documentNumber: string | null;
  documentVerified: boolean;
}

export interface TeamTournamentOperationsRecord {
  id: string;
  name: string;
  sportId: string;
  teamOperationsOpenAt: Date | null;
  teamOperationsCloseAt: Date | null;
}

export interface TeamBasicProfileRecord {
  id: string;
  name: string;
}

export interface TeamMembershipRecord {
  id: string;
  isActive: boolean;
}

export interface TeamConflictMembershipRecord {
  id: string;
  team: {
    id: string;
    name: string;
    sportId: string;
  };
}

export interface TeamPromotionRecord {
  id: string;
  name: string;
  logoUrl: string | null;
  creatorId: string | null;
  franchiseId: string | null;
}

export interface TeamSportCodeRecord {
  id: string;
  sport: {
    code: string;
  };
}

export interface TeamLogoRecord {
  id: string;
  name: string;
  logoAssetId: string | null;
}

export interface TeamAccessRecord {
  id: string;
  creatorId: string | null;
  captainId: string | null;
}

export interface TeamDebtRecord {
  id: string;
  type: DebtType;
  status: DebtStatus;
  originAmount: { toString(): string };
  currentBalance: { toString(): string };
  registrationId: string | null;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface TeamRegistrationSummaryRecord {
  id: string;
  tournament: { name: string | null } | null;
  category: { name: string | null } | null;
}

export interface TeamProofAssetRecord {
  id: string;
  bucket: string;
  storageKey: string;
  metadata: unknown;
  createdAt: Date;
}

export interface TeamSanctionRecord {
  id: string;
  targetProfileId: string | null;
  status: string;
  reason: string;
  notes: string | null;
  endsAt: Date | null;
  targetProfile: {
    id: string;
    name: string;
  } | null;
}

export interface TeamMatchPreviewSource {
  id: string;
  matchDate: Date;
  matchType: string;
  homeScore: number;
  awayScore: number;
  status: string;
  homeTeam: { id: string; name: string; logoUrl: string | null } | null;
  awayTeam: { id: string; name: string; logoUrl: string | null } | null;
  venue: { id: string; name: string } | null;
  category: {
    id: string;
    name: string;
    slug: string | null;
    tournament: { id: string; name: string; slug: string } | null;
  } | null;
}

export interface TeamDetailRecord extends Record<string, unknown> {
  id: string;
  name: string;
  sportId?: string;
  creatorId?: string | null;
  captainId?: string | null;
  logoAssetId?: string | null;
  franchiseId?: string | null;
  sport?: Record<string, unknown>;
  members?: Array<Record<string, unknown>>;
  teamZones?: Array<Record<string, unknown>>;
  registrations?: Array<Record<string, unknown>>;
}

export interface TeamListResult {
  data: Array<Record<string, unknown>>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TeamRepository {
  isTeamSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
  isFranchiseSlugTaken(slug: string): Promise<boolean>;
  findCreatorProfileById(
    profileId: string,
  ): Promise<TeamCreatorProfileRecord | null>;
  findSportById(sportId: string): Promise<{ id: string } | null>;
  findCaptainProfileById(
    profileId: string,
  ): Promise<TeamBasicProfileRecord | null>;
  createTeam(params: {
    name: string;
    slug: string;
    sportId: string;
    creatorId: string;
    captainId?: string;
    logoUrl?: string;
    franchiseId?: string;
  }): Promise<TeamDetailRecord>;
  findProfileDocumentNumber(
    profileId: string,
  ): Promise<{ documentNumber: string | null } | null>;
  listMyTeams(
    profileId: string,
    documentNumber: string | null,
  ): Promise<Array<Record<string, unknown>>>;
  listTeams(paginationDto: PaginationSchemaDto): Promise<TeamListResult>;
  findTeamDetailById(id: string): Promise<TeamDetailRecord | null>;
  updateTeam(
    id: string,
    data: {
      name?: string;
      sportId?: string;
      captainId?: string;
      logoUrl?: string;
      franchiseId?: string;
      slug?: string;
    },
  ): Promise<TeamDetailRecord>;
  softDeleteTeam(id: string): Promise<void>;
  findProfileById(profileId: string): Promise<TeamBasicProfileRecord | null>;
  findMembership(
    teamId: string,
    profileId: string,
    onlyActive?: boolean,
  ): Promise<TeamMembershipRecord | null>;
  reactivateMembership(membershipId: string): Promise<void>;
  findConflictingMembership(params: {
    teamId: string;
    profileId: string;
    sportId: string;
  }): Promise<TeamConflictMembershipRecord | null>;
  createMembership(teamId: string, profileId: string): Promise<void>;
  deactivateMembership(membershipId: string): Promise<void>;
  assignCaptain(teamId: string, profileId: string): Promise<TeamDetailRecord>;
  findPromotionCandidate(
    teamId: string,
  ): Promise<TeamPromotionRecord | null>;
  promoteToFranchise(params: {
    teamId: string;
    name: string;
    slug: string;
    logoUrl?: string;
    ownerId: string;
  }): Promise<{
    franchise: Record<string, unknown>;
    team: TeamDetailRecord;
  }>;
  findSportCodeByTeamId(teamId: string): Promise<TeamSportCodeRecord | null>;
  countActiveTeamMembers(teamId: string): Promise<number>;
  findLogoByTeamId(teamId: string): Promise<TeamLogoRecord | null>;
  updateTeamLogoAsset(teamId: string, assetId: string): Promise<void>;
  findTeamExists(teamId: string): Promise<{ id: string } | null>;
  findLastMatchPreview(teamId: string): Promise<TeamMatchPreviewSource | null>;
  findNextMatchPreview(teamId: string): Promise<TeamMatchPreviewSource | null>;
  findBalanceAccess(teamId: string): Promise<TeamAccessRecord | null>;
  findDebtsByTeamId(teamId: string): Promise<TeamDebtRecord[]>;
  findRegistrationSummariesByTeamId(
    teamId: string,
  ): Promise<TeamRegistrationSummaryRecord[]>;
  findPaymentProofAssets(paymentIds: string[]): Promise<TeamProofAssetRecord[]>;
  findActiveRosterProfileIds(teamId: string): Promise<string[]>;
  findActiveProfileSanctions(profileIds: string[]): Promise<TeamSanctionRecord[]>;
}

