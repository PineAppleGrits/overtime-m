import { Injectable } from '@nestjs/common';
import { CategorySubstatus, Prisma } from '@prisma/client';
import type { PaginationDto } from '@overtime-mono/shared';
import { PrismaService } from '../../../database/prisma.service';
import type {
  RegistrationConflictEntry,
  RegistrationDetailRecord,
  RegistrationEditableRecord,
  RegistrationRepository,
  RegistrationResolvedPlayer,
  RegistrationsListResult,
} from '../../application/ports/registration-repository.port';

const registrationDetailInclude =
  Prisma.validator<Prisma.RegistrationInclude>()({
    team: {
      include: {
        sport: true,
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
      },
    },
    tournament: {
      include: {
        sport: true,
        categories: {
          select: {
            id: true,
            name: true,
            substatus: true,
          },
        },
      },
    },
    category: {
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        zones: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    requester: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    approver: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    payments: {
      orderBy: {
        createdAt: 'desc',
      },
    },
    rosterEntries: {
      orderBy: {
        addedAt: 'asc',
      },
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
        addedByProfile: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
    _count: {
      select: {
        payments: true,
        rosterEntries: true,
      },
    },
  });

type RegistrationDetailPayload = Prisma.RegistrationGetPayload<{
  include: typeof registrationDetailInclude;
}>;

@Injectable()
export class PrismaRegistrationRepository implements RegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTeamById(teamId: string) {
    return this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true, name: true, sportId: true },
    });
  }

  async findTournamentById(tournamentId: string) {
    return this.prisma.tournament.findUnique({
      where: { id: tournamentId, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        registrationStartDate: true,
        registrationEndDate: true,
      },
    });
  }

  async findCategoryById(categoryId: string) {
    return this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      include: {
        tournament: {
          select: { sportId: true },
        },
      },
    });
  }

  async findExistingActiveRegistration(teamId: string, tournamentId: string) {
    return this.prisma.registration.findFirst({
      where: {
        teamId,
        tournamentId,
        status: {
          notIn: ['rechazada'],
        },
      },
      select: {
        categoryId: true,
      },
    });
  }

  async findDetailById(id: string): Promise<RegistrationDetailRecord | null> {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: registrationDetailInclude,
    });

    return registration
      ? this.toDetailRecord(registration)
      : null;
  }

  async findEditableById(id: string): Promise<RegistrationEditableRecord | null> {
    return this.prisma.registration.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            substatus: true,
          },
        },
        rosterEntries: {
          select: {
            profileId: true,
            type: true,
          },
        },
      },
    });
  }

  async list(
    paginationDto: PaginationDto,
    filters?: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ): Promise<RegistrationsListResult> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;
    const where: Prisma.RegistrationWhereInput = {};

    if (filters?.tournamentId) where.tournamentId = filters.tournamentId;
    if (filters?.teamId) where.teamId = filters.teamId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.status) where.status = filters.status;

    const [registrations, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              sport: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              substatus: true,
            },
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rosterEntries: {
            select: {
              profileId: true,
            },
          },
          _count: {
            select: {
              payments: true,
              rosterEntries: true,
            },
          },
        },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      data: registrations as Array<Record<string, unknown>>,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createPendingRegistration(params: {
    teamId: string;
    tournamentId: string;
    categoryId: string;
    requestedBy: string;
    players: RegistrationResolvedPlayer[];
  }): Promise<RegistrationDetailRecord> {
    return this.prisma.$transaction(async (tx) => {
      for (const player of params.players) {
        const existingMembership = await tx.profileTeam.findFirst({
          where: {
            teamId: params.teamId,
            profileId: player.profileId,
          },
          select: {
            id: true,
            isActive: true,
          },
        });

        if (!existingMembership) {
          await tx.profileTeam.create({
            data: {
              teamId: params.teamId,
              profileId: player.profileId,
            },
          });
        } else if (!existingMembership.isActive) {
          await tx.profileTeam.update({
            where: { id: existingMembership.id },
            data: {
              isActive: true,
              joinedAt: new Date(),
            },
          });
        }
      }

      const createdRegistration = await tx.registration.create({
        data: {
          teamId: params.teamId,
          tournamentId: params.tournamentId,
          categoryId: params.categoryId,
          requestedBy: params.requestedBy,
          status: 'pendiente',
        },
        select: {
          id: true,
        },
      });

      await tx.registrationRosterEntry.createMany({
        data: params.players.map((player) => ({
          registrationId: createdRegistration.id,
          profileId: player.profileId,
          type: 'INITIAL',
          addedByProfileId: params.requestedBy,
        })),
      });

      const detail = await tx.registration.findUnique({
        where: { id: createdRegistration.id },
        include: registrationDetailInclude,
      });

      return this.toDetailRecord(detail as RegistrationDetailPayload);
    });
  }

  async addRosterEntry(params: {
    registrationId: string;
    teamId: string;
    profileId: string;
    addedBy: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.profileTeam.findFirst({
        where: {
          teamId: params.teamId,
          profileId: params.profileId,
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!existingMembership) {
        await tx.profileTeam.create({
          data: {
            teamId: params.teamId,
            profileId: params.profileId,
          },
        });
      } else if (!existingMembership.isActive) {
        await tx.profileTeam.update({
          where: { id: existingMembership.id },
          data: {
            isActive: true,
            joinedAt: new Date(),
          },
        });
      }

      await tx.registrationRosterEntry.create({
        data: {
          registrationId: params.registrationId,
          profileId: params.profileId,
          type: 'ADDITION',
          addedByProfileId: params.addedBy,
        },
      });
    });
  }

  async findRosterConflicts(params: {
    profileIds: string[];
    tournamentId: string;
    categoryId: string;
    teamId: string;
    excludeRegistrationId?: string;
  }): Promise<RegistrationConflictEntry[]> {
    return this.prisma.registrationRosterEntry.findMany({
      where: {
        profileId: { in: params.profileIds },
        registration: {
          tournamentId: params.tournamentId,
          status: {
            in: ['pendiente', 'aprobada', 'pagada'],
          },
          ...(params.excludeRegistrationId
            ? {
                id: {
                  not: params.excludeRegistrationId,
                },
              }
            : {}),
        },
      },
      select: {
        profileId: true,
        registration: {
          select: {
            id: true,
            teamId: true,
            categoryId: true,
          },
        },
      },
    });
  }

  async countScheduledRegularMatches(params: {
    teamId: string;
    categoryId: string;
  }): Promise<number> {
    return this.prisma.match.count({
      where: {
        deletedAt: null,
        categoryId: params.categoryId,
        matchType: 'regular',
        OR: [
          { homeTeamId: params.teamId },
          { awayTeamId: params.teamId },
        ],
      },
    });
  }

  async countRemainingRegularMatches(params: {
    teamId: string;
    categoryId: string;
    statuses: string[];
  }): Promise<number> {
    return this.prisma.match.count({
      where: {
        deletedAt: null,
        categoryId: params.categoryId,
        matchType: 'regular',
        status: {
          in: params.statuses,
        },
        OR: [
          { homeTeamId: params.teamId },
          { awayTeamId: params.teamId },
        ],
      },
    });
  }

  async approveRegistration(id: string, approvedBy: string) {
    const registration = await this.prisma.registration.update({
      where: { id },
      data: {
        status: 'aprobada',
        approvedBy,
        approvedAt: new Date(),
      },
      include: registrationDetailInclude,
    });

    return this.toDetailRecord(registration);
  }

  async rejectRegistration(params: {
    id: string;
    approvedBy: string;
    rejectionReason: string;
  }) {
    const registration = await this.prisma.registration.update({
      where: { id: params.id },
      data: {
        status: 'rechazada',
        approvedBy: params.approvedBy,
        rejectedAt: new Date(),
        rejectionReason: params.rejectionReason,
      },
      include: registrationDetailInclude,
    });

    return this.toDetailRecord(registration);
  }

  async deleteRegistration(id: string): Promise<void> {
    await this.prisma.registration.delete({
      where: { id },
    });
  }

  private toDetailRecord(
    registration: RegistrationDetailPayload,
  ): RegistrationDetailRecord {
    return {
      ...registration,
      category: {
        id: registration.category.id,
        name: registration.category.name,
        substatus: registration.category.substatus ?? null,
      },
      rosterEntries: registration.rosterEntries.map((entry) => ({
        ...entry,
        type: entry.type,
      })),
    };
  }
}

