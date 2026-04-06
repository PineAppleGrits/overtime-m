import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateTournamentSchemaDto,
  TournamentStatus,
  UpdateTournamentSchemaDto,
  ChangeStatusDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { generateUniqueSlug } from '../common/utils/slug.util';

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateTournamentSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        const existingTournament = await this.prisma.tournament.findFirst({
          where: {
            slug,
            ...(excludeId ? { id: { not: excludeId } } : {}),
          },
          select: { id: true },
        });

        return Boolean(existingTournament);
      },
    });
  }

  /**
   * Validar transiciones de estado permitidas
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: TournamentStatus,
  ): void {
    const validTransitions: Record<string, TournamentStatus[]> = {
      DRAFT: [
        TournamentStatus.OPEN,
        TournamentStatus.ARCHIVED,
        TournamentStatus.CANCELLED,
      ],
      OPEN: [
        TournamentStatus.CLOSED,
        TournamentStatus.ARCHIVED,
        TournamentStatus.CANCELLED,
      ],
      CLOSED: [
        TournamentStatus.READY_TO_SHIP,
        TournamentStatus.ARCHIVED,
        TournamentStatus.CANCELLED,
      ],
      READY_TO_SHIP: [
        TournamentStatus.IN_PROGRESS,
        TournamentStatus.ARCHIVED,
        TournamentStatus.CANCELLED,
      ],
      IN_PROGRESS: [
        TournamentStatus.FINISHED,
        TournamentStatus.ARCHIVED,
        TournamentStatus.CANCELLED,
      ],
      FINISHED: [TournamentStatus.ARCHIVED],
      ARCHIVED: [],
      CANCELLED: [],
    };

    const allowedStatuses = validTransitions[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowedStatuses.join(', ')}`,
      );
    }
  }

  /**
   * Aplicar transiciones automáticas de estado basadas en fechas
   */
  private async applyAutomaticStatusTransitions(): Promise<void> {
    const now = new Date();

    await this.prisma.tournament.updateMany({
      where: {
        status: TournamentStatus.OPEN,
        registrationEndDate: { lte: now },
      },
      data: { status: TournamentStatus.CLOSED },
    });

    await this.prisma.tournament.updateMany({
      where: {
        status: {
          in: [TournamentStatus.CLOSED, TournamentStatus.READY_TO_SHIP],
        },
        endDate: { lte: now },
      },
      data: { status: TournamentStatus.FINISHED },
    });
  }

  async create(createTournamentDto: CreateTournamentSchemaDto) {
    // Verificar que el deporte existe
    const sport = await this.prisma.sport.findUnique({
      where: { id: createTournamentDto.sportId },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    // Validar fechas
    if (
      createTournamentDto.startDate &&
      createTournamentDto.endDate &&
      new Date(createTournamentDto.startDate) >
        new Date(createTournamentDto.endDate)
    ) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (
      createTournamentDto.registrationStartDate &&
      createTournamentDto.registrationEndDate &&
      new Date(createTournamentDto.registrationStartDate) >
        new Date(createTournamentDto.registrationEndDate)
    ) {
      throw new BadRequestException(
        'Registration start date must be before registration end date',
      );
    }

    if (
      createTournamentDto.teamOperationsOpenAt &&
      createTournamentDto.teamOperationsCloseAt &&
      new Date(createTournamentDto.teamOperationsOpenAt) >
        new Date(createTournamentDto.teamOperationsCloseAt)
    ) {
      throw new BadRequestException(
        'Team operations open date must be before team operations close date',
      );
    }

    const tournament = await this.prisma.tournament.create({
      data: {
        name: createTournamentDto.name,
        slug: await this.generateTournamentSlug(createTournamentDto.name),
        description: createTournamentDto.description ?? null,
        sportId: createTournamentDto.sportId,
        status: createTournamentDto.status ?? TournamentStatus.DRAFT,
        startDate: createTournamentDto.startDate
          ? new Date(createTournamentDto.startDate)
          : null,
        endDate: createTournamentDto.endDate
          ? new Date(createTournamentDto.endDate)
          : null,
        registrationStartDate: createTournamentDto.registrationStartDate
          ? new Date(createTournamentDto.registrationStartDate)
          : null,
        registrationEndDate: createTournamentDto.registrationEndDate
          ? new Date(createTournamentDto.registrationEndDate)
          : null,
        teamOperationsOpenAt: createTournamentDto.teamOperationsOpenAt
          ? new Date(createTournamentDto.teamOperationsOpenAt)
          : null,
        teamOperationsCloseAt: createTournamentDto.teamOperationsCloseAt
          ? new Date(createTournamentDto.teamOperationsCloseAt)
          : null,
        insurancePerPlayer: createTournamentDto.insurancePerPlayer ?? null,
      },
      include: {
        sport: true,
        categories: {
          include: {
            zones: true,
          },
        },
        _count: {
          select: {
            categories: true,
            registrations: true,
          },
        },
      },
    });

    this.logger.log(`Tournament created: ${tournament.name}`);

    return tournament;
  }

  async findAll(paginationDto: PaginationDto, status?: string) {
    // Aplicar transiciones automáticas antes de listar
    await this.applyAutomaticStatusTransitions();

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

    if (status) {
      where.status = status;
    }

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sport: true,
          categories: {
            include: {
              zones: {
                include: {
                  _count: {
                    select: {
                      teamZones: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              categories: true,
              registrations: true,
            },
          },
        },
      }),
      this.prisma.tournament.count({ where }),
    ]);

    return {
      data: tournaments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    // Aplicar transiciones automáticas antes de obtener
    await this.applyAutomaticStatusTransitions();

    const tournament = await this.prisma.tournament.findFirst({
      where: { slug, deletedAt: null },
      include: {
        sport: true,
        categories: {
          include: {
            zones: {
              include: {
                teamZones: {
                  include: {
                    team: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
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
            },
            _count: {
              select: {
                zones: true,
                registrations: true,
                matches: true,
              },
            },
          },
        },
        registrations: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
            category: true,
          },
        },
        _count: {
          select: {
            categories: true,
            registrations: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with slug "${slug}" not found`);
    }

    return tournament;
  }

  async findOne(id: string) {
    // Aplicar transiciones automáticas antes de obtener
    await this.applyAutomaticStatusTransitions();

    const tournament = await this.prisma.tournament.findUnique({
      where: { id, deletedAt: null },
      include: {
        sport: true,
        categories: {
          include: {
            zones: {
              include: {
                teamZones: {
                  include: {
                    team: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
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
            },
            _count: {
              select: {
                zones: true,
                registrations: true,
                matches: true,
              },
            },
          },
        },
        registrations: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
            category: true,
          },
        },
        _count: {
          select: {
            categories: true,
            registrations: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    return tournament;
  }

  async update(id: string, updateTournamentDto: UpdateTournamentSchemaDto) {
    const tournament = await this.findOne(id);

    // Si se está actualizando el deporte, verificar que existe
    if (updateTournamentDto.sportId) {
      const sport = await this.prisma.sport.findUnique({
        where: { id: updateTournamentDto.sportId },
      });

      if (!sport) {
        throw new NotFoundException('Sport not found');
      }
    }

    // Validar fechas si se proporcionan
    const startDate = updateTournamentDto.startDate
      ? new Date(updateTournamentDto.startDate)
      : tournament.startDate;
    const endDate = updateTournamentDto.endDate
      ? new Date(updateTournamentDto.endDate)
      : tournament.endDate;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const registrationStartDate = updateTournamentDto.registrationStartDate
      ? new Date(updateTournamentDto.registrationStartDate)
      : tournament.registrationStartDate;
    const registrationEndDate = updateTournamentDto.registrationEndDate
      ? new Date(updateTournamentDto.registrationEndDate)
      : tournament.registrationEndDate;

    if (
      registrationStartDate &&
      registrationEndDate &&
      registrationStartDate > registrationEndDate
    ) {
      throw new BadRequestException(
        'Registration start date must be before registration end date',
      );
    }

    const teamOperationsOpenAt = updateTournamentDto.teamOperationsOpenAt
      ? new Date(updateTournamentDto.teamOperationsOpenAt)
      : tournament.teamOperationsOpenAt;
    const teamOperationsCloseAt = updateTournamentDto.teamOperationsCloseAt
      ? new Date(updateTournamentDto.teamOperationsCloseAt)
      : tournament.teamOperationsCloseAt;

    if (
      teamOperationsOpenAt &&
      teamOperationsCloseAt &&
      teamOperationsOpenAt > teamOperationsCloseAt
    ) {
      throw new BadRequestException(
        'Team operations open date must be before team operations close date',
      );
    }

    // Si se está cambiando el estado, validar transición
    if (updateTournamentDto.status) {
      this.validateStatusTransition(
        tournament.status,
        updateTournamentDto.status,
      );
    }

    const updatedTournament = await this.prisma.tournament.update({
      where: { id },
      data: {
        ...updateTournamentDto,
        slug: updateTournamentDto.name
          ? await this.generateTournamentSlug(updateTournamentDto.name, id)
          : undefined,
        startDate: updateTournamentDto.startDate
          ? new Date(updateTournamentDto.startDate)
          : undefined,
        endDate: updateTournamentDto.endDate
          ? new Date(updateTournamentDto.endDate)
          : undefined,
        registrationStartDate: updateTournamentDto.registrationStartDate
          ? new Date(updateTournamentDto.registrationStartDate)
          : undefined,
        registrationEndDate: updateTournamentDto.registrationEndDate
          ? new Date(updateTournamentDto.registrationEndDate)
          : undefined,
        teamOperationsOpenAt: updateTournamentDto.teamOperationsOpenAt
          ? new Date(updateTournamentDto.teamOperationsOpenAt)
          : undefined,
        teamOperationsCloseAt: updateTournamentDto.teamOperationsCloseAt
          ? new Date(updateTournamentDto.teamOperationsCloseAt)
          : undefined,
      },
      include: {
        sport: true,
        categories: {
          include: {
            zones: true,
          },
        },
        _count: {
          select: {
            categories: true,
            registrations: true,
          },
        },
      },
    });

    this.logger.log(`Tournament updated: ${updatedTournament.name}`);

    return updatedTournament;
  }

  async changeStatus(id: string, changeStatusDto: ChangeStatusDto) {
    const tournament = await this.findOne(id);

    this.validateStatusTransition(tournament.status, changeStatusDto.status);

    const updatedTournament = await this.prisma.tournament.update({
      where: { id },
      data: {
        status: changeStatusDto.status,
      },
      include: {
        sport: true,
        categories: {
          include: {
            zones: true,
          },
        },
        _count: {
          select: {
            categories: true,
            registrations: true,
          },
        },
      },
    });

    this.logger.log(
      `Tournament status changed: ${tournament.name} -> ${changeStatusDto.status}`,
    );

    return updatedTournament;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tournament.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Tournament deleted: ${id}`);

    return { message: 'Tournament deleted successfully' };
  }
}
