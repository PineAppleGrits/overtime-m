import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IEligibilityRepository,
  MatchScopeSnapshot,
  PlayerTournamentMembership,
  ProfileEligibilitySnapshot,
} from '../../application/ports/eligibility-repository.port';

/**
 * Estados de Registration considerados "activos" para los checks RN-007 / RN-038.
 * Coincide con `ACTIVE_REGISTRATION_STATUSES` del módulo registrations.
 */
const ACTIVE_REGISTRATION_STATUSES = ['pendiente', 'aprobada', 'pagada'];

@Injectable()
export class PrismaEligibilityRepository implements IEligibilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileSnapshot(
    profileId: string,
  ): Promise<ProfileEligibilitySnapshot | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId, deletedAt: null },
      include: {
        currentMedicalAsset: true,
        currentSwornAsset: true,
      },
    });
    if (!profile) return null;
    return {
      id: profile.id,
      documentNumber: profile.documentNumber,
      currentMedicalAsset: profile.currentMedicalAsset,
      currentSwornAsset: profile.currentSwornAsset,
    };
  }

  async getMatchScope(matchId: string): Promise<MatchScopeSnapshot | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        categoryId: true,
        category: { select: { tournamentId: true } },
      },
    });
    if (!match) return null;
    return {
      matchId: match.id,
      categoryId: match.categoryId,
      tournamentId: match.category?.tournamentId ?? null,
    };
  }

  async countActiveRoster(teamId: string): Promise<number> {
    return this.prisma.profileTeam.count({
      where: { teamId, isActive: true },
    });
  }

  async teamExists(teamId: string): Promise<boolean> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true },
    });
    return team !== null;
  }

  async findActiveRegistrationsForProfileInTournament(
    profileId: string,
    tournamentId: string,
  ): Promise<PlayerTournamentMembership[]> {
    const rows = await this.prisma.registrationRosterEntry.findMany({
      where: {
        profileId,
        registration: {
          tournamentId,
          status: { in: ACTIVE_REGISTRATION_STATUSES },
        },
      },
      select: {
        registration: {
          select: {
            id: true,
            teamId: true,
            categoryId: true,
          },
        },
      },
    });
    return rows.map((row) => ({
      registrationId: row.registration.id,
      teamId: row.registration.teamId,
      categoryId: row.registration.categoryId,
    }));
  }

  async isProfileInMatchRoster(
    matchId: string,
    profileId: string,
  ): Promise<boolean> {
    const found = await this.prisma.matchRoster.findFirst({
      where: { matchId, profileId },
      select: { id: true },
    });
    return found !== null;
  }

  async getMatchSportContext(
    matchId: string,
  ): Promise<{ sportCode: string; modality: string } | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        category: {
          select: {
            tournament: {
              select: {
                modality: true,
                sport: { select: { code: true } },
              },
            },
          },
        },
      },
    });
    const tournament = match?.category?.tournament;
    if (!tournament || !tournament.modality) return null;
    return {
      sportCode: tournament.sport.code,
      modality: tournament.modality,
    };
  }
}
