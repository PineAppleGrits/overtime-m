import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  CheckAvailabilityDto,
  CreateVenueDto,
  PaginationDto,
  UpdateVenueDto,
} from '@overtime-mono/shared';
import { PrismaService } from '../../../database/prisma.service';
import type {
  IVenueRepository,
  VenueFindAllFilter,
} from '../../application/ports/venue-repository.port';

@Injectable()
export class PrismaVenueRepository implements IVenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateVenueDto) {
    return this.prisma.venue.create({
      data,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    pagination: PaginationDto;
    filter: VenueFindAllFilter;
  }) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params.pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.VenueWhereInput = {
      deletedAt: null,
      ...(params.filter.isActive !== undefined
        ? { isActive: params.filter.isActive }
        : {}),
    };

    const [data, total] = await Promise.all([
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

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.venue.findUnique({
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
  }

  async update(id: string, data: UpdateVenueDto) {
    return this.prisma.venue.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });
  }

  async softDelete(id: string) {
    await this.prisma.venue.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countActiveMatches(id: string) {
    return this.prisma.match.count({
      where: {
        venueId: id,
        deletedAt: null,
        status: {
          notIn: ['finalizado', 'cancelado'],
        },
      },
    });
  }

  async findAvailable(params: {
    checkAvailability: CheckAvailabilityDto;
    pagination: PaginationDto;
  }) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
    } = params.pagination;

    const skip = (page - 1) * limit;
    const date = new Date(params.checkAvailability.date);
    const endDate = params.checkAvailability.endDate
      ? new Date(params.checkAvailability.endDate)
      : date;

    const venues = await this.prisma.venue.findMany({
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
            ...(params.checkAvailability.excludeMatchId
              ? {
                  id: {
                    not: params.checkAvailability.excludeMatchId,
                  },
                }
              : {}),
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

    const available = venues.filter((venue) => venue.matches.length === 0);
    return {
      data: available.slice(skip, skip + limit).map((venue) => {
        const { matches, ...venueData } = venue;
        return venueData;
      }),
      total: available.length,
    };
  }

  async findConflictingMatches(
    venueId: string,
    checkAvailabilityDto: CheckAvailabilityDto,
  ) {
    const date = new Date(checkAvailabilityDto.date);
    const endDate = checkAvailabilityDto.endDate
      ? new Date(checkAvailabilityDto.endDate)
      : date;

    return this.prisma.match.findMany({
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
        ...(checkAvailabilityDto.excludeMatchId
          ? {
              id: {
                not: checkAvailabilityDto.excludeMatchId,
              },
            }
          : {}),
      },
      select: {
        id: true,
        matchDate: true,
        homeTeamId: true,
        awayTeamId: true,
      },
    });
  }
}
