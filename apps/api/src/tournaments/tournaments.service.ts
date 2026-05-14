import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CreateTournamentSchemaDto,
  TournamentStatus,
  UpdateTournamentSchemaDto,
  ChangeStatusDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { ValidateModalityUseCase } from './application/use-cases/validate-modality.use-case';
import { ChangeTournamentStatusUseCase } from './application/use-cases/change-status.use-case';
import { validateTournamentWindows } from './domain/rules/date-windows.rules';

const SUPPORTED_TOURNAMENT_STATUSES = new Set<string>(
  Object.values(TournamentStatus),
);

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validateModality: ValidateModalityUseCase,
    private readonly changeStatusUseCase: ChangeTournamentStatusUseCase,
  ) {}

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
   * Aplica transiciones automáticas de estado basadas en fechas:
   * - PUBLISHED → INSCRIPTION_OPEN cuando `registrationStartDate ≤ now`
   * - INSCRIPTION_OPEN → INSCRIPTION_CLOSED cuando `registrationEndDate ≤ now`
   *
   * Notas:
   * - Esta versión no contempla cupos llenos (se evalúa al inscribirse).
   * - No mueve nada hacia PLAYING/FINISHED: esas transiciones son manuales.
   */
  private async applyAutomaticStatusTransitions(): Promise<void> {
    const now = new Date();

    await this.prisma.tournament.updateMany({
      where: {
        status: TournamentStatus.PUBLISHED,
        registrationStartDate: { lte: now },
      },
      data: { status: TournamentStatus.INSCRIPTION_OPEN },
    });

    await this.prisma.tournament.updateMany({
      where: {
        status: TournamentStatus.INSCRIPTION_OPEN,
        registrationEndDate: { lte: now },
      },
      data: { status: TournamentStatus.INSCRIPTION_CLOSED },
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

    // RN-043 — validar modalidad si viene seteada
    this.validateModality.execute({
      sportCode: sport.code as 'BASKETBALL',
      modality: createTournamentDto.modality ?? null,
    });

    // RN-046 — validar ventanas de fechas
    const invalidWindow = validateTournamentWindows({
      startDate: createTournamentDto.startDate,
      endDate: createTournamentDto.endDate,
      registrationStartDate: createTournamentDto.registrationStartDate,
      registrationEndDate: createTournamentDto.registrationEndDate,
      teamOperationsOpenAt: createTournamentDto.teamOperationsOpenAt,
      teamOperationsCloseAt: createTournamentDto.teamOperationsCloseAt,
    });
    if (invalidWindow) {
      throw new BadRequestException(invalidWindow.message);
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
        fixtureFormat: createTournamentDto.fixtureFormat ?? undefined,
        modality: createTournamentDto.modality ?? null,
        // RN-058 — repechaje (default Prisma: BO1)
        promotionPlayoffFormat:
          createTournamentDto.promotionPlayoffFormat ?? undefined,
        // DP-013 — umbral de antelación (TODO: aplicar cuando RN-052 lo consuma)
        earlyCancellationThresholdHours:
          createTournamentDto.earlyCancellationThresholdHours ?? null,
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

  async findAll(
    paginationDto: PaginationDto,
    status?: string,
    publishedOnly?: boolean,
  ) {
    // Aplicar transiciones automáticas antes de listar
    await this.applyAutomaticStatusTransitions();

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: Prisma.TournamentWhereInput = {
      deletedAt: null,
    };

    if (status) {
      if (!SUPPORTED_TOURNAMENT_STATUSES.has(status)) {
        throw new BadRequestException(
          `Estado de torneo inválido: ${status}. Valores permitidos: ${[
            ...SUPPORTED_TOURNAMENT_STATUSES,
          ].join(', ')}`,
        );
      }
      where.status = status as TournamentStatus;
    }

    // RN-018 — publicación progresiva: sólo torneos con al menos 1 registration `approved`
    if (publishedOnly) {
      where.registrations = {
        some: { status: 'approved' },
      };
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
    let resolvedSportCode = tournament.sport.code;
    if (updateTournamentDto.sportId) {
      const sport = await this.prisma.sport.findUnique({
        where: { id: updateTournamentDto.sportId },
      });

      if (!sport) {
        throw new NotFoundException('Sport not found');
      }
      resolvedSportCode = sport.code;
    }

    // RN-043 — si se cambia la modalidad, validar combinación con el sport actual
    if (updateTournamentDto.modality !== undefined) {
      this.validateModality.execute({
        sportCode: resolvedSportCode as 'BASKETBALL',
        modality: updateTournamentDto.modality,
      });
    }

    // RN-046 — validar ventanas de fechas combinadas
    const startDate = updateTournamentDto.startDate
      ? new Date(updateTournamentDto.startDate)
      : tournament.startDate;
    const endDate = updateTournamentDto.endDate
      ? new Date(updateTournamentDto.endDate)
      : tournament.endDate;
    const registrationStartDate = updateTournamentDto.registrationStartDate
      ? new Date(updateTournamentDto.registrationStartDate)
      : tournament.registrationStartDate;
    const registrationEndDate = updateTournamentDto.registrationEndDate
      ? new Date(updateTournamentDto.registrationEndDate)
      : tournament.registrationEndDate;
    const teamOperationsOpenAt = updateTournamentDto.teamOperationsOpenAt
      ? new Date(updateTournamentDto.teamOperationsOpenAt)
      : tournament.teamOperationsOpenAt;
    const teamOperationsCloseAt = updateTournamentDto.teamOperationsCloseAt
      ? new Date(updateTournamentDto.teamOperationsCloseAt)
      : tournament.teamOperationsCloseAt;

    const invalidWindow = validateTournamentWindows({
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      teamOperationsOpenAt,
      teamOperationsCloseAt,
    });
    if (invalidWindow) {
      throw new BadRequestException(invalidWindow.message);
    }

    // Si se está cambiando el estado, delegar al use-case (valida transición + emite evento).
    if (
      updateTournamentDto.status &&
      updateTournamentDto.status !== tournament.status
    ) {
      await this.changeStatusUseCase.execute({
        tournamentId: id,
        newStatus: updateTournamentDto.status,
      });
    }

    const updatedTournament = await this.prisma.tournament.update({
      where: { id },
      data: {
        ...(updateTournamentDto.name !== undefined
          ? { name: updateTournamentDto.name }
          : {}),
        ...(updateTournamentDto.description !== undefined
          ? { description: updateTournamentDto.description }
          : {}),
        ...(updateTournamentDto.sportId !== undefined
          ? { sportId: updateTournamentDto.sportId }
          : {}),
        ...(updateTournamentDto.fixtureFormat !== undefined
          ? { fixtureFormat: updateTournamentDto.fixtureFormat }
          : {}),
        ...(updateTournamentDto.modality !== undefined
          ? { modality: updateTournamentDto.modality }
          : {}),
        ...(updateTournamentDto.insurancePerPlayer !== undefined
          ? { insurancePerPlayer: updateTournamentDto.insurancePerPlayer }
          : {}),
        ...(updateTournamentDto.promotionPlayoffFormat !== undefined
          ? {
              promotionPlayoffFormat:
                updateTournamentDto.promotionPlayoffFormat,
            }
          : {}),
        ...(updateTournamentDto.earlyCancellationThresholdHours !== undefined
          ? {
              earlyCancellationThresholdHours:
                updateTournamentDto.earlyCancellationThresholdHours,
            }
          : {}),
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
    // Delegar al use-case (valida transición + emite evento de dominio).
    await this.changeStatusUseCase.execute({
      tournamentId: id,
      newStatus: changeStatusDto.status,
    });

    return this.prisma.tournament.findUnique({
      where: { id },
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
