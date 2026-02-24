import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateZoneDto, UpdateZoneDto, AssignTeamDto, PaginationDto } from '@overtime-mono/shared';

@Injectable()
export class ZonesService {
  private readonly logger = new Logger(ZonesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createZoneDto: CreateZoneDto) {
    // Verificar que la categoría existe
    const category = await this.prisma.category.findUnique({
      where: { id: createZoneDto.categoryId, deletedAt: null },
      include: {
        tournament: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const zone = await this.prisma.zone.create({
      data: createZoneDto,
      include: {
        category: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        teamZones: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            teamZones: true,
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Zone created: ${zone.name}`);

    return zone;
  }

  async findAll(categoryId: string, paginationDto: PaginationDto) {
    // Verificar que la categoría existe
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const [zones, total] = await Promise.all([
      this.prisma.zone.findMany({
        where: {
          categoryId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          teamZones: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              teamZones: true,
              matches: true,
            },
          },
        },
      }),
      this.prisma.zone.count({
        where: {
          categoryId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: zones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        teamZones: {
          include: {
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
                  },
                },
                _count: {
                  select: {
                    members: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            teamZones: true,
            matches: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return zone;
  }

  async update(id: string, updateZoneDto: UpdateZoneDto) {
    await this.findOne(id);

    const updatedZone = await this.prisma.zone.update({
      where: { id },
      data: updateZoneDto,
      include: {
        category: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        teamZones: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            teamZones: true,
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Zone updated: ${updatedZone.name}`);

    return updatedZone;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.zone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Zone deleted: ${id}`);

    return { message: 'Zone deleted successfully' };
  }

  /**
   * Asignar equipo a zona
   * REGLA DE NEGOCIO: Un equipo solo puede estar en 1 categoría por torneo
   */
  async assignTeam(zoneId: string, assignTeamDto: AssignTeamDto) {
    const zone = await this.findOne(zoneId);

    // Verificar que el equipo existe
    const team = await this.prisma.team.findUnique({
      where: { id: assignTeamDto.teamId, deletedAt: null },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Verificar que el equipo no está ya en esta zona
    const existingAssignment = await this.prisma.teamZone.findFirst({
      where: {
        zoneId,
        teamId: assignTeamDto.teamId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Team is already assigned to this zone');
    }

    // REGLA DE NEGOCIO: Un equipo solo puede estar en 1 categoría por torneo
    // Obtener el torneo de la categoría
    const category = await this.prisma.category.findUnique({
      where: { id: zone.categoryId },
      include: {
        tournament: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verificar si el equipo ya está en otra categoría del mismo torneo
    const teamZones = await this.prisma.teamZone.findMany({
      where: {
        teamId: assignTeamDto.teamId,
      },
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
    });

    for (const tz of teamZones) {
      if (tz.zone.category.tournament.id === category.tournament.id) {
        if (tz.zone.category.id !== category.id) {
          throw new ConflictException(
            `Team is already assigned to another category (${tz.zone.category.name}) in this tournament`,
          );
        }
      }
    }

    const categoryWithTournament = await this.prisma.category.findUnique({
      where: { id: zone.categoryId },
      include: { tournament: { select: { sportId: true } } },
    });

    if (team.sportId !== categoryWithTournament?.tournament.sportId) {
      throw new BadRequestException('Team sport must match category sport');
    }

    // Asignar equipo a zona
    await this.prisma.teamZone.create({
      data: {
        zoneId,
        teamId: assignTeamDto.teamId,
      },
    });

    this.logger.log(`Team ${team.name} assigned to zone ${zone.name}`);

    return this.findOne(zoneId);
  }

  /**
   * Remover equipo de zona
   */
  async removeTeam(zoneId: string, teamId: string) {
    await this.findOne(zoneId);

    const teamZone = await this.prisma.teamZone.findFirst({
      where: {
        zoneId,
        teamId,
      },
    });

    if (!teamZone) {
      throw new NotFoundException('Team is not assigned to this zone');
    }

    await this.prisma.teamZone.delete({
      where: { id: teamZone.id },
    });

    this.logger.log(`Team ${teamId} removed from zone ${zoneId}`);

    return this.findOne(zoneId);
  }
}
