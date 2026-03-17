import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTeamDto, UpdateTeamDto, AddPlayerDto, PaginationDto } from '@overtime-mono/shared';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto, creatorId: string) {
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

  async findAll(paginationDto: PaginationDto) {
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

  async update(id: string, updateTeamDto: UpdateTeamDto) {
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
      data: updateTeamDto,
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

  async addPlayer(teamId: string, addPlayerDto: AddPlayerDto) {
    const team = await this.findOne(teamId);

    const profile = await this.prisma.profile.findUnique({
      where: { id: addPlayerDto.profileId },
      include: {
        teamMemberships: {
          where: { isActive: true },
          include: {
            team: {
              include: {
                teamZones: {
                  include: {
                    zone: { include: { category: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

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

    const teamCategories = team.teamZones.map((tz) => tz.zone.category.id);

    if (teamCategories.length > 0) {
      for (const membership of profile.teamMemberships) {
        const otherTeamCategories = membership.team.teamZones.map(
          (tz) => tz.zone.category.id,
        );
        const commonCategories = teamCategories.filter((catId) =>
          otherTeamCategories.includes(catId),
        );
        if (commonCategories.length > 0) {
          throw new ConflictException(
            `Profile is already in another team in the same category`,
          );
        }
      }
    }

    await this.prisma.profileTeam.create({
      data: {
        teamId,
        profileId: addPlayerDto.profileId,
      },
    });

    this.logger.log(
      `Profile ${profile.name} added to team ${team.name}`,
    );

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
}
