import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PaginationSchemaDto } from '@overtime-mono/shared';
import { PrismaService } from '../../../database/prisma.service';
import type {
  TeamDetailRecord,
  TeamRepository,
} from '../../application/ports/team-repository.port';

const teamDetailInclude = {
  sport: true,
  franchise: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  captain: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  members: {
    where: { isActive: true },
    include: {
      profile: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          documentNumber: true,
        },
      },
    },
  },
  teamZones: {
    include: {
      zone: {
        include: {
          category: {
            include: {
              tournament: true,
            },
          },
        },
      },
    },
  },
  registrations: {
    include: {
      tournament: true,
      category: true,
    },
  },
} satisfies Prisma.TeamInclude;

@Injectable()
export class PrismaTeamRepository implements TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isTeamSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return Boolean(existingTeam);
  }

  async isFranchiseSlugTaken(slug: string): Promise<boolean> {
    const existingFranchise = await this.prisma.franchise.findFirst({
      where: { slug },
      select: { id: true },
    });

    return Boolean(existingFranchise);
  }

  async findCreatorProfileById(profileId: string) {
    return this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        documentNumber: true,
        documentVerified: true,
      },
    });
  }

  async findSportById(sportId: string) {
    return this.prisma.sport.findUnique({
      where: { id: sportId },
      select: { id: true },
    });
  }

  async findCaptainProfileById(profileId: string) {
    return this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, name: true },
    });
  }

  async createTeam(params: {
    name: string;
    slug: string;
    sportId: string;
    creatorId: string;
    captainId?: string;
    logoUrl?: string;
    franchiseId?: string;
  }): Promise<TeamDetailRecord> {
    return this.prisma.team.create({
      data: {
        ...params,
        captainId: params.captainId,
        logoUrl: params.logoUrl,
        franchiseId: params.franchiseId,
        members: {
          create: { profileId: params.creatorId },
        },
      },
      include: teamDetailInclude,
    }) as Promise<TeamDetailRecord>;
  }

  async findProfileDocumentNumber(profileId: string) {
    return this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { documentNumber: true },
    });
  }

  async listMyTeams(profileId: string, documentNumber: string | null) {
    return this.prisma.team.findMany({
      where: {
        deletedAt: null,
        OR: [
          { creatorId: profileId },
          {
            members: {
              some: {
                isActive: true,
                profile: {
                  OR: [
                    { id: profileId },
                    ...(documentNumber ? [{ documentNumber }] : []),
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        sport: true,
        franchise: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        creator: { select: { id: true, name: true, email: true } },
        captain: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          where: { isActive: true },
          include: {
            profile: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Array<Record<string, unknown>>>;
  }

  async listTeams(paginationDto: PaginationSchemaDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;
    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sport: true,
          creator: {
            select: { id: true, name: true, email: true },
          },
          captain: {
            select: { id: true, name: true, avatarUrl: true },
          },
          members: {
            include: {
              profile: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.team.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: teams as Array<Record<string, unknown>>,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findTeamDetailById(id: string): Promise<TeamDetailRecord | null> {
    return this.prisma.team.findUnique({
      where: { id, deletedAt: null },
      include: teamDetailInclude,
    }) as Promise<TeamDetailRecord | null>;
  }

  async updateTeam(
    id: string,
    data: {
      name?: string;
      sportId?: string;
      captainId?: string;
      logoUrl?: string;
      franchiseId?: string;
      slug?: string;
    },
  ): Promise<TeamDetailRecord> {
    return this.prisma.team.update({
      where: { id },
      data,
      include: teamDetailInclude,
    }) as Promise<TeamDetailRecord>;
  }

  async softDeleteTeam(id: string): Promise<void> {
    await this.prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findProfileById(profileId: string) {
    return this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, name: true },
    });
  }

  async findMembership(teamId: string, profileId: string, onlyActive = false) {
    return this.prisma.profileTeam.findFirst({
      where: {
        teamId,
        profileId,
        ...(onlyActive ? { isActive: true } : {}),
      },
      select: {
        id: true,
        isActive: true,
      },
    });
  }

  async reactivateMembership(membershipId: string): Promise<void> {
    await this.prisma.profileTeam.update({
      where: { id: membershipId },
      data: { isActive: true, joinedAt: new Date() },
    });
  }

  async findConflictingMembership(params: {
    teamId: string;
    profileId: string;
    sportId: string;
  }) {
    return this.prisma.profileTeam.findFirst({
      where: {
        profileId: params.profileId,
        isActive: true,
        teamId: { not: params.teamId },
        team: {
          sportId: params.sportId,
          deletedAt: null,
        },
      },
      include: {
        team: {
          select: { id: true, name: true, sportId: true },
        },
      },
    });
  }

  async createMembership(teamId: string, profileId: string): Promise<void> {
    await this.prisma.profileTeam.create({
      data: {
        teamId,
        profileId,
      },
    });
  }

  async deactivateMembership(membershipId: string): Promise<void> {
    await this.prisma.profileTeam.update({
      where: { id: membershipId },
      data: { isActive: false },
    });
  }

  async assignCaptain(teamId: string, profileId: string): Promise<TeamDetailRecord> {
    return this.prisma.team.update({
      where: { id: teamId },
      data: { captainId: profileId },
      include: teamDetailInclude,
    }) as Promise<TeamDetailRecord>;
  }

  async findPromotionCandidate(teamId: string) {
    return this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        creatorId: true,
        franchiseId: true,
      },
    });
  }

  async promoteToFranchise(params: {
    teamId: string;
    name: string;
    slug: string;
    logoUrl?: string;
    ownerId: string;
  }): Promise<{
    franchise: Record<string, unknown>;
    team: TeamDetailRecord;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const franchise = await tx.franchise.create({
        data: {
          name: params.name,
          slug: params.slug,
          logoUrl: params.logoUrl,
          ownerId: params.ownerId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          ownerId: true,
          createdAt: true,
        },
      });

      const updatedTeam = await tx.team.update({
        where: { id: params.teamId },
        data: {
          franchiseId: franchise.id,
        },
        include: teamDetailInclude,
      });

      return {
        franchise: franchise as Record<string, unknown>,
        team: updatedTeam as TeamDetailRecord,
      };
    });
  }

  async findSportCodeByTeamId(teamId: string) {
    return this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        sport: { select: { code: true } },
      },
    });
  }

  async countActiveTeamMembers(teamId: string): Promise<number> {
    return this.prisma.profileTeam.count({
      where: { teamId, isActive: true },
    });
  }

  async findLogoByTeamId(teamId: string) {
    return this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true, name: true, logoAssetId: true },
    });
  }

  async updateTeamLogoAsset(teamId: string, assetId: string): Promise<void> {
    await this.prisma.team.update({
      where: { id: teamId },
      data: { logoAssetId: assetId },
    });
  }

  async findTeamExists(teamId: string) {
    return this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true },
    });
  }

  async findLastMatchPreview(teamId: string) {
    return this.prisma.match.findFirst({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        deletedAt: null,
        status: 'finalizado',
      },
      orderBy: { matchDate: 'desc' },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        venue: { select: { id: true, name: true } },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            tournament: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async findNextMatchPreview(teamId: string) {
    return this.prisma.match.findFirst({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        deletedAt: null,
        status: { in: ['programado', 'reprogramado'] },
      },
      orderBy: { matchDate: 'asc' },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        venue: { select: { id: true, name: true } },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            tournament: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async findBalanceAccess(teamId: string) {
    return this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true, creatorId: true, captainId: true },
    });
  }

  async findDebtsByTeamId(teamId: string) {
    return this.prisma.debt.findMany({
      where: {
        teamId,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        status: true,
        originAmount: true,
        currentBalance: true,
        registrationId: true,
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findRegistrationSummariesByTeamId(teamId: string) {
    return this.prisma.registration.findMany({
      where: { teamId },
      select: {
        id: true,
        tournament: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
  }

  async findPaymentProofAssets(paymentIds: string[]) {
    if (!paymentIds.length) {
      return [];
    }

    return this.prisma.mediaAsset.findMany({
      where: {
        category: 'PAYMENT_PROOF',
        deletedAt: null,
        metadata: { path: ['paymentId'], string_contains: '' },
      },
      select: {
        id: true,
        bucket: true,
        storageKey: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  async findActiveRosterProfileIds(teamId: string): Promise<string[]> {
    const rows = await this.prisma.profileTeam.findMany({
      where: { teamId, isActive: true },
      select: { profileId: true },
    });

    return rows.map((row) => row.profileId);
  }

  async findActiveProfileSanctions(profileIds: string[]) {
    if (!profileIds.length) {
      return [];
    }

    return this.prisma.sanction.findMany({
      where: {
        targetType: 'PROFILE',
        kind: 'DISCIPLINARY',
        targetProfileId: { in: profileIds },
      },
      select: {
        id: true,
        targetProfileId: true,
        status: true,
        reason: true,
        notes: true,
        endsAt: true,
        targetProfile: { select: { id: true, name: true } },
      },
    });
  }
}

