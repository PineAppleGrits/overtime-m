import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CategorySubstatus, Prisma } from '@prisma/client';
import type {
  AddRegistrationRosterEntryDto,
  CreateRegistrationSchemaDto,
  PaginationDto,
  RegistrationRosterPlayerDto,
} from '@overtime-mono/shared';
import { PrismaService } from '../database/prisma.service';
import { EligibilityService } from '../eligibility/eligibility.service';
import {
  ACTIVE_REGISTRATION_STATUSES,
  EDITABLE_REGISTRATION_STATUSES,
  MAX_ADDITIONS,
  MAX_TOTAL_ROSTER,
  MIN_INITIAL_ROSTER,
  NON_FINISHED_MATCH_STATUSES,
  PLAYOFF_CUTOFF_REMAINING_MATCHES,
} from './registrations.constants';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

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

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: EligibilityService,
  ) {}

  private assertNoDuplicateProfileIds(profileIds: string[]): void {
    if (new Set(profileIds).size !== profileIds.length) {
      throw new BadRequestException('Roster cannot contain duplicated players');
    }
  }

  private assertInitialRosterSize(players: Array<unknown>): void {
    if (players.length < MIN_INITIAL_ROSTER) {
      throw new BadRequestException(
        `Initial roster must contain at least ${MIN_INITIAL_ROSTER} players`,
      );
    }

    if (players.length > MAX_TOTAL_ROSTER) {
      throw new BadRequestException(
        `Initial roster cannot contain more than ${MAX_TOTAL_ROSTER} players`,
      );
    }
  }

  private normalizeDocumentNumber(documentNumber: string): string {
    return documentNumber.trim();
  }

  private async ensureActiveTeamMembership(
    prisma: PrismaClientLike,
    teamId: string,
    profileId: string,
  ): Promise<void> {
    const existingMembership = await prisma.profileTeam.findFirst({
      where: {
        teamId,
        profileId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!existingMembership) {
      await prisma.profileTeam.create({
        data: {
          teamId,
          profileId,
        },
      });
      return;
    }

    if (!existingMembership.isActive) {
      await prisma.profileTeam.update({
        where: { id: existingMembership.id },
        data: {
          isActive: true,
          joinedAt: new Date(),
        },
      });
    }
  }

  private async resolveRosterPlayers(
    prisma: PrismaClientLike,
    teamId: string,
    players: RegistrationRosterPlayerDto[],
  ): Promise<
    Array<{ profileId: string; name: string; documentNumber: string | null }>
  > {
    const resolvedPlayers: Array<{
      profileId: string;
      name: string;
      documentNumber: string | null;
    }> = [];

    for (const player of players) {
      if (!player.documentNumber || !player.name) {
        throw new BadRequestException(
          'Roster players must include documentNumber and name',
        );
      }

      const documentNumber = this.normalizeDocumentNumber(player.documentNumber);

      let profile = await prisma.profile.findFirst({
        where: {
          documentNumber,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          documentNumber: true,
        },
      });

      if (!profile) {
        profile = await prisma.profile.create({
          data: {
            name: player.name,
            documentNumber,
            role: 'player',
          },
          select: {
            id: true,
            name: true,
            documentNumber: true,
          },
        });
      }

      await this.ensureActiveTeamMembership(prisma, teamId, profile.id);

      resolvedPlayers.push({
        profileId: profile.id,
        name: profile.name,
        documentNumber: profile.documentNumber,
      });
    }

    this.assertNoDuplicateProfileIds(
      resolvedPlayers.map((player) => player.profileId),
    );

    return resolvedPlayers;
  }

  private async assertProfilesCanJoinTournamentRoster(
    params: {
      profileIds: string[];
      tournamentId: string;
      categoryId: string;
      teamId: string;
      excludeRegistrationId?: string;
    },
    prisma: PrismaClientLike = this.prisma,
  ): Promise<void> {
    const rosterEntries = await prisma.registrationRosterEntry.findMany({
      where: {
        profileId: { in: params.profileIds },
        registration: {
          tournamentId: params.tournamentId,
          status: {
            in: [...ACTIVE_REGISTRATION_STATUSES],
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

    for (const profileId of params.profileIds) {
      const profileEntries = rosterEntries.filter(
        (entry) => entry.profileId === profileId,
      );

      const teamIds = new Set(
        profileEntries.map((entry) => entry.registration.teamId),
      );

      if (teamIds.size >= 2) {
        throw new ConflictException(
          'A player cannot belong to more than 2 teams in the same tournament',
        );
      }

      const sameCategoryConflict = profileEntries.some(
        (entry) =>
          entry.registration.categoryId === params.categoryId &&
          entry.registration.teamId !== params.teamId,
      );

      if (sameCategoryConflict) {
        throw new ConflictException(
          'A player cannot belong to multiple teams in the same category of a tournament',
        );
      }
    }
  }

  private async getRemainingRegularMatchesCount(registration: {
    teamId: string;
    categoryId: string;
  }): Promise<number | null> {
    const baseWhere: Prisma.MatchWhereInput = {
      deletedAt: null,
      categoryId: registration.categoryId,
      matchType: 'regular',
      OR: [
        {
          homeTeamId: registration.teamId,
        },
        {
          awayTeamId: registration.teamId,
        },
      ],
    };

    const totalScheduledMatches = await this.prisma.match.count({
      where: baseWhere,
    });

    if (totalScheduledMatches === 0) {
      return null;
    }

    return this.prisma.match.count({
      where: {
        ...baseWhere,
        status: {
          in: [...NON_FINISHED_MATCH_STATUSES],
        },
      },
    });
  }

  private async assertRosterAdditionWindow(registration: {
    teamId: string;
    categoryId: string;
    category: {
      substatus: CategorySubstatus | null;
    };
  }): Promise<void> {
    if (registration.category.substatus === CategorySubstatus.PLAYOFFS_FASE) {
      throw new BadRequestException(
        'Roster additions are closed because the category is already in playoffs',
      );
    }

    const remainingMatches =
      await this.getRemainingRegularMatchesCount(registration);

    if (remainingMatches === null) {
      return;
    }

    if (remainingMatches <= PLAYOFF_CUTOFF_REMAINING_MATCHES) {
      throw new BadRequestException(
        `Roster additions are closed when the team has ${PLAYOFF_CUTOFF_REMAINING_MATCHES} or fewer regular matches remaining`,
      );
    }
  }

  private async getRegistrationDetailOrThrow(
    id: string,
    prisma: PrismaClientLike = this.prisma,
  ) {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: registrationDetailInclude,
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    return registration;
  }

  async create(
    createRegistrationDto: CreateRegistrationSchemaDto,
    requestedBy: string,
  ) {
    this.assertInitialRosterSize(createRegistrationDto.initialRoster);

    const team = await this.prisma.team.findUnique({
      where: { id: createRegistrationDto.teamId, deletedAt: null },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: createRegistrationDto.tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new BadRequestException(
        `Tournament is not accepting registrations. Current status: ${tournament.status}`,
      );
    }

    const now = new Date();
    if (
      tournament.registrationStartDate &&
      tournament.registrationStartDate > now
    ) {
      throw new BadRequestException('Registration period has not started yet');
    }

    if (
      tournament.registrationEndDate &&
      tournament.registrationEndDate < now
    ) {
      throw new BadRequestException('Registration period has ended');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: createRegistrationDto.categoryId, deletedAt: null },
      include: { tournament: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.tournamentId !== createRegistrationDto.tournamentId) {
      throw new BadRequestException(
        'Category does not belong to the specified tournament',
      );
    }

    if (team.sportId !== category.tournament.sportId) {
      throw new BadRequestException('Team sport must match category sport');
    }

    await this.eligibilityService.assertTeamEligibleForRegistration({
      teamId: createRegistrationDto.teamId,
      tournamentId: createRegistrationDto.tournamentId,
      categoryId: createRegistrationDto.categoryId,
    });

    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        teamId: createRegistrationDto.teamId,
        tournamentId: createRegistrationDto.tournamentId,
        status: {
          notIn: ['rechazada'],
        },
      },
    });

    if (existingRegistration) {
      if (
        existingRegistration.categoryId === createRegistrationDto.categoryId
      ) {
        throw new ConflictException(
          'Team is already registered in this category',
        );
      }

      throw new ConflictException(
        `Team is already registered in another category (${existingRegistration.categoryId}) of this tournament. A team can only be in one category per tournament.`,
      );
    }

    const registration = await this.prisma.$transaction(async (tx) => {
      const resolvedPlayers = await this.resolveRosterPlayers(
        tx,
        createRegistrationDto.teamId,
        createRegistrationDto.initialRoster,
      );

      await this.assertProfilesCanJoinTournamentRoster(
        {
          profileIds: resolvedPlayers.map((player) => player.profileId),
          tournamentId: createRegistrationDto.tournamentId,
          categoryId: createRegistrationDto.categoryId,
          teamId: createRegistrationDto.teamId,
        },
        tx,
      );

      for (const player of resolvedPlayers) {
        await this.eligibilityService.assertProfileEligibleForRegistration(
          {
            profileId: player.profileId,
            tournamentId: createRegistrationDto.tournamentId,
            categoryId: createRegistrationDto.categoryId,
          },
          tx,
        );
      }

      const createdRegistration = await tx.registration.create({
        data: {
          teamId: createRegistrationDto.teamId,
          tournamentId: createRegistrationDto.tournamentId,
          categoryId: createRegistrationDto.categoryId,
          requestedBy,
          status: 'pendiente',
        },
        select: {
          id: true,
        },
      });

      await tx.registrationRosterEntry.createMany({
        data: resolvedPlayers.map((player) => ({
          registrationId: createdRegistration.id,
          profileId: player.profileId,
          type: 'INITIAL',
          addedByProfileId: requestedBy,
        })),
      });

      return this.getRegistrationDetailOrThrow(createdRegistration.id, tx);
    });

    this.logger.log(
      `Registration created: Team ${team.name} -> Tournament ${tournament.name}, Category ${category.name}`,
    );

    return registration;
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: Prisma.RegistrationWhereInput = {};

    if (filters?.tournamentId) {
      where.tournamentId = filters.tournamentId;
    }

    if (filters?.teamId) {
      where.teamId = filters.teamId;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

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
      data: registrations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.getRegistrationDetailOrThrow(id);
  }

  async findRoster(id: string) {
    const registration = await this.getRegistrationDetailOrThrow(id);

    return {
      data: registration.rosterEntries,
      meta: {
        total: registration.rosterEntries.length,
        initialCount: registration.rosterEntries.filter(
          (entry) => entry.type === 'INITIAL',
        ).length,
        additionsCount: registration.rosterEntries.filter(
          (entry) => entry.type === 'ADDITION',
        ).length,
      },
    };
  }

  async addRosterEntry(
    id: string,
    addRosterEntryDto: AddRegistrationRosterEntryDto,
    addedBy: string,
  ) {
    const registration = await this.prisma.registration.findUnique({
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

    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    if (
      !EDITABLE_REGISTRATION_STATUSES.includes(
        registration.status as (typeof EDITABLE_REGISTRATION_STATUSES)[number],
      )
    ) {
      throw new BadRequestException(
        `Cannot edit roster for registration with status: ${registration.status}`,
      );
    }

    const currentTotal = registration.rosterEntries.length;
    const currentAdditions = registration.rosterEntries.filter(
      (entry) => entry.type === 'ADDITION',
    ).length;

    if (currentTotal >= MAX_TOTAL_ROSTER) {
      throw new BadRequestException(
        `Roster cannot contain more than ${MAX_TOTAL_ROSTER} players`,
      );
    }

    if (currentAdditions >= MAX_ADDITIONS) {
      throw new BadRequestException(
        `Roster cannot contain more than ${MAX_ADDITIONS} additions after registration`,
      );
    }

    await this.assertRosterAdditionWindow({
      teamId: registration.teamId,
      categoryId: registration.categoryId,
      category: registration.category,
    });

    const resolvedPlayers = await this.prisma.$transaction(async (tx) => {
      const resolved = await this.resolveRosterPlayers(
        tx,
        registration.teamId,
        [addRosterEntryDto],
      );

      if (
        registration.rosterEntries.some(
          (entry) => entry.profileId === resolved[0].profileId,
        )
      ) {
        throw new ConflictException('Profile is already part of this roster');
      }

      await this.assertProfilesCanJoinTournamentRoster(
        {
          profileIds: [resolved[0].profileId],
          tournamentId: registration.tournamentId,
          categoryId: registration.categoryId,
          teamId: registration.teamId,
          excludeRegistrationId: registration.id,
        },
        tx,
      );

      await this.eligibilityService.assertTeamEligibleForRegistration(
        {
          teamId: registration.teamId,
          tournamentId: registration.tournamentId,
          categoryId: registration.categoryId,
        },
        tx,
      );

      await this.eligibilityService.assertProfileEligibleForRegistration(
        {
          profileId: resolved[0].profileId,
          tournamentId: registration.tournamentId,
          categoryId: registration.categoryId,
        },
        tx,
      );

      await tx.registrationRosterEntry.create({
        data: {
          registrationId: registration.id,
          profileId: resolved[0].profileId,
          type: 'ADDITION',
          addedByProfileId: addedBy,
        },
      });

      return resolved;
    });

    this.logger.log(
      `Roster addition created for registration ${registration.id}: ${resolvedPlayers[0].profileId}`,
    );

    return this.getRegistrationDetailOrThrow(id);
  }

  async approve(id: string, approvedBy: string) {
    const registration = await this.findOne(id);

    if (registration.status !== 'pendiente') {
      throw new BadRequestException(
        `Cannot approve registration with status: ${registration.status}`,
      );
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: {
        status: 'aprobada',
        approvedBy,
        approvedAt: new Date(),
      },
      include: registrationDetailInclude,
    });

    this.logger.log(`Registration approved: ${id}`);

    return updatedRegistration;
  }

  async reject(id: string, approvedBy: string, rejectionReason?: string) {
    const registration = await this.findOne(id);

    if (registration.status !== 'pendiente') {
      throw new BadRequestException(
        `Cannot reject registration with status: ${registration.status}`,
      );
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: {
        status: 'rechazada',
        approvedBy,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || 'Rejected by administrator',
      },
      include: registrationDetailInclude,
    });

    this.logger.log(`Registration rejected: ${id}`);

    return updatedRegistration;
  }

  async remove(id: string) {
    const registration = await this.findOne(id);

    if (
      registration.status === 'aprobada' ||
      registration.status === 'pagada'
    ) {
      throw new BadRequestException(
        'Cannot delete approved or paid registration',
      );
    }

    await this.prisma.registration.delete({
      where: { id },
    });

    this.logger.log(`Registration deleted: ${id}`);

    return { message: 'Registration deleted successfully' };
  }
}
