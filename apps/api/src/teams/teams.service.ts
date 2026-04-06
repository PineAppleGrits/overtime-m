import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type {
  CreateFranchiseSchemaDto,
  AddPlayerSchemaDto,
  CreateTeamSchemaDto,
  PaginationSchemaDto,
  UpdateTeamSchemaDto,
} from '@overtime-mono/shared';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { EligibilityService } from '../eligibility/eligibility.service';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: EligibilityService,
  ) {}

  private async generateTeamSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        const existingTeam = await this.prisma.team.findFirst({
          where: {
            slug,
            ...(excludeId ? { id: { not: excludeId } } : {}),
          },
          select: { id: true },
        });

        return Boolean(existingTeam);
      },
    });
  }

  private async generateFranchiseSlug(name: string): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        const existingFranchise = await this.prisma.franchise.findFirst({
          where: { slug },
          select: { id: true },
        });

        return Boolean(existingFranchise);
      },
    });
  }

  private async getTournamentForTeamOperations(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sportId: true,
        teamOperationsOpenAt: true,
        teamOperationsCloseAt: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  private validateTournamentTeamOperationsWindow(tournament: {
    name: string;
    teamOperationsOpenAt: Date | null;
    teamOperationsCloseAt: Date | null;
  }): void {
    const now = new Date();

    if (
      tournament.teamOperationsOpenAt &&
      tournament.teamOperationsOpenAt > now
    ) {
      throw new BadRequestException(
        `Team operations are not open yet for tournament ${tournament.name}`,
      );
    }

    if (
      tournament.teamOperationsCloseAt &&
      tournament.teamOperationsCloseAt < now
    ) {
      throw new BadRequestException(
        `Team operations are closed for tournament ${tournament.name}`,
      );
    }
  }

  async create(createTeamDto: CreateTeamSchemaDto, creatorId: string) {
    // Verificar que el deporte existe
    const sport = await this.prisma.sport.findUnique({
      where: { id: createTeamDto.sportId },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    if (createTeamDto.captainId) {
      const captain = await this.prisma.profile.findUnique({
        where: { id: createTeamDto.captainId },
      });
      if (!captain) {
        throw new NotFoundException('Captain not found');
      }
    }

    const team = await this.prisma.team.create({
      data: {
        ...createTeamDto,
        slug: await this.generateTeamSlug(createTeamDto.name),
        creatorId,
        members: {
          create: { profileId: creatorId },
        },
      },
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
          include: {
            profile: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Team created: ${team.name}`);

    return team;
  }

  async createForTournament(
    tournamentId: string,
    createTeamDto: CreateTeamSchemaDto,
    creatorId: string,
  ) {
    const tournament = await this.getTournamentForTeamOperations(tournamentId);

    this.validateTournamentTeamOperationsWindow(tournament);

    if (createTeamDto.sportId !== tournament.sportId) {
      throw new BadRequestException('Team sport must match tournament sport');
    }

    return this.create(createTeamDto, creatorId);
  }

  async findMine(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { documentNumber: true },
    });

    const documentNumber = profile?.documentNumber ?? null;

    const teams = await this.prisma.team.findMany({
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
    });

    return teams;
  }

  async findAll(paginationDto: PaginationSchemaDto) {
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
              avatarUrl: true,
            },
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
      data: teams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id, deletedAt: null },
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
          include: {
            profile: true,
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
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamSchemaDto) {
    await this.findOne(id);

    // Si se está actualizando el deporte, verificar que existe
    if (updateTeamDto.sportId) {
      const sport = await this.prisma.sport.findUnique({
        where: { id: updateTeamDto.sportId },
      });

      if (!sport) {
        throw new NotFoundException('Sport not found');
      }
    }

    if (updateTeamDto.captainId) {
      const captain = await this.prisma.profile.findUnique({
        where: { id: updateTeamDto.captainId },
      });
      if (!captain) {
        throw new NotFoundException('Captain not found');
      }
      const member = await this.prisma.profileTeam.findFirst({
        where: {
          teamId: id,
          profileId: updateTeamDto.captainId,
          isActive: true,
        },
      });
      if (!member) {
        throw new BadRequestException('Captain must be a member of the team');
      }
    }

    const team = await this.prisma.team.update({
      where: { id },
      data: {
        ...updateTeamDto,
        slug: updateTeamDto.name
          ? await this.generateTeamSlug(updateTeamDto.name, id)
          : undefined,
      },
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
            avatarUrl: true,
          },
        },
        members: {
          include: {
            profile: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Team updated: ${team.name}`);

    return team;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Team deleted: ${id}`);

    return { message: 'Team deleted successfully' };
  }

  async addPlayer(teamId: string, addPlayerDto: AddPlayerSchemaDto) {
    const team = await this.findOne(teamId);

    const profile = await this.prisma.profile.findUnique({
      where: { id: addPlayerDto.profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.eligibilityService.assertProfileNotBlacklisted(profile.id);

    const existingMembership = await this.prisma.profileTeam.findFirst({
      where: {
        teamId,
        profileId: addPlayerDto.profileId,
      },
    });

    if (existingMembership) {
      if (!existingMembership.isActive) {
        await this.prisma.profileTeam.update({
          where: { id: existingMembership.id },
          data: { isActive: true, joinedAt: new Date() },
        });
        return this.findOne(teamId);
      }
      throw new ConflictException('Profile already in team');
    }

    await this.prisma.profileTeam.create({
      data: {
        teamId,
        profileId: addPlayerDto.profileId,
      },
    });

    this.logger.log(`Profile ${profile.name} added to team ${team.name}`);

    return this.findOne(teamId);
  }

  async removePlayer(teamId: string, profileId: string) {
    await this.findOne(teamId);

    const membership = await this.prisma.profileTeam.findFirst({
      where: {
        teamId,
        profileId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Profile not in team');
    }

    await this.prisma.profileTeam.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    this.logger.log(`Profile ${profileId} removed from team ${teamId}`);

    return this.findOne(teamId);
  }

  async assignCaptain(teamId: string, profileId: string) {
    const team = await this.findOne(teamId);

    const member = await this.prisma.profileTeam.findFirst({
      where: {
        teamId,
        profileId,
        isActive: true,
      },
    });

    if (!member) {
      throw new BadRequestException('Captain must be a member of the team');
    }

    const updatedTeam = await this.prisma.team.update({
      where: { id: teamId },
      data: { captainId: profileId },
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
            avatarUrl: true,
          },
        },
        members: {
          include: {
            profile: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Captain assigned to team ${team.name}`);

    return updatedTeam;
  }

  async promoteToFranchise(
    teamId: string,
    dto: CreateFranchiseSchemaDto,
    ownerId: string,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        creatorId: true,
        franchiseId: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.creatorId !== ownerId) {
      throw new ConflictException(
        'Only the team creator can promote a team to a franchise',
      );
    }

    if (team.franchiseId) {
      throw new ConflictException('Team is already part of a franchise');
    }

    const promotedTeam = await this.prisma.$transaction(async (tx) => {
      const franchise = await tx.franchise.create({
        data: {
          name: dto.name,
          slug: await this.generateFranchiseSlug(dto.name),
          logoUrl: dto.logoUrl,
          ownerId,
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
        where: { id: teamId },
        data: {
          franchiseId: franchise.id,
        },
        include: {
          sport: true,
          franchise: true,
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
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      return {
        franchise,
        team: updatedTeam,
      };
    });

    this.logger.log(
      `Team ${team.name} promoted to franchise ${promotedTeam.franchise.name}`,
    );

    return promotedTeam;
  }
}
