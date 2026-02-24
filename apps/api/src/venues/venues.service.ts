import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVenueDto, UpdateVenueDto, CheckAvailabilityDto, PaginationDto } from '@overtime-mono/shared';

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createVenueDto: CreateVenueDto) {
    const venue = await this.prisma.venue.create({
      data: createVenueDto,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Venue created: ${venue.name}`);

    return venue;
  }

  async findAll(paginationDto: PaginationDto, isActive?: boolean) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [venues, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              matches: true,
            },
          },
        },
      }),
      this.prisma.venue.count({ where }),
    ]);

    return {
      data: venues,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id, deletedAt: null },
      include: {
        matches: {
          where: {
            deletedAt: null,
          },
          include: {
            homeTeam: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                tournament: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            matchDate: 'asc',
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    return venue;
  }

  async update(id: string, updateVenueDto: UpdateVenueDto) {
    await this.findOne(id);

    const updatedVenue = await this.prisma.venue.update({
      where: { id },
      data: updateVenueDto,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Venue updated: ${updatedVenue.name}`);

    return updatedVenue;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Verificar si hay partidos asignados
    const matchesCount = await this.prisma.match.count({
      where: {
        venueId: id,
        deletedAt: null,
        status: {
          notIn: ['finalizado', 'cancelado'],
        },
      },
    });

    if (matchesCount > 0) {
      throw new BadRequestException(
        `Cannot delete venue with ${matchesCount} active match(es) assigned`,
      );
    }

    await this.prisma.venue.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Venue deleted: ${id}`);

    return { message: 'Venue deleted successfully' };
  }

  /**
   * Verificar disponibilidad de una cancha en una fecha/horario específico
   */
  async checkAvailability(
    venueId: string,
    checkAvailabilityDto: CheckAvailabilityDto,
  ) {
    const venue = await this.findOne(venueId);

    if (!venue.isActive) {
      return {
        available: false,
        reason: 'Venue is not active',
      };
    }

    const date = new Date(checkAvailabilityDto.date);
    const endDate = checkAvailabilityDto.endDate
      ? new Date(checkAvailabilityDto.endDate)
      : date;

    // Buscar partidos que se solapen con el rango de fechas
    const conflictingMatches = await this.prisma.match.findMany({
      where: {
        venueId,
        deletedAt: null,
        status: {
          notIn: ['cancelado', 'finalizado'],
        },
        matchDate: {
          gte: date,
          lte: endDate,
        },
        ...(checkAvailabilityDto.excludeMatchId && {
          id: {
            not: checkAvailabilityDto.excludeMatchId,
          },
        }),
      },
    });

    if (conflictingMatches.length > 0) {
      return {
        available: false,
        reason: 'Venue has conflicting matches',
        conflictingMatches: conflictingMatches.map((match) => ({
          id: match.id,
          matchDate: match.matchDate,
          homeTeam: match.homeTeamId,
          awayTeam: match.awayTeamId,
        })),
      };
    }

    return {
      available: true,
    };
  }

  /**
   * Obtener canchas disponibles en un rango de fechas
   */
  async findAvailableVenues(
    checkAvailabilityDto: CheckAvailabilityDto,
    paginationDto: PaginationDto,
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const date = new Date(checkAvailabilityDto.date);
    const endDate = checkAvailabilityDto.endDate
      ? new Date(checkAvailabilityDto.endDate)
      : date;

    // Obtener todas las canchas activas
    const allVenues = await this.prisma.venue.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      include: {
        matches: {
          where: {
            deletedAt: null,
            status: {
              notIn: ['cancelado', 'finalizado'],
            },
            matchDate: {
              gte: date,
              lte: endDate,
            },
            ...(checkAvailabilityDto.excludeMatchId && {
              id: {
                not: checkAvailabilityDto.excludeMatchId,
              },
            }),
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    // Filtrar solo las disponibles (sin partidos conflictivos)
    const availableVenues = allVenues
      .filter((venue) => venue.matches.length === 0)
      .slice(skip, skip + limit);

    const total = allVenues.filter(
      (venue) => venue.matches.length === 0,
    ).length;

    return {
      data: availableVenues.map((venue) => {
        const { matches, ...venueData } = venue;
        return venueData;
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
