import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMatchDto, MatchStatus, MatchType } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { ChangeMatchStatusDto } from './dto/change-status.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { VenuesService } from '../venues/venues.service';
import { PlayoffGenerator } from '../fixtures/generators/playoff.generator';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly venuesService: VenuesService,
    @Inject(forwardRef(() => PlayoffGenerator))
    private readonly playoffGenerator: PlayoffGenerator,
  ) {}

  /**
   * Validar que dos equipos están en la misma categoría
   */
  private async validateTeamsInSameCategory(
    homeTeamId: string,
    awayTeamId: string,
    categoryId?: string,
  ): Promise<void> {
    if (!categoryId) {
      // Si no hay categoría, no se puede validar (solo para amistosos)
      return;
    }

    // Obtener las zonas de cada equipo en la categoría
    const homeTeamZones = await this.prisma.teamZone.findMany({
      where: {
        teamId: homeTeamId,
        zone: {
          categoryId,
        },
      },
      include: {
        zone: {
          include: {
            category: true,
          },
        },
      },
    });

    const awayTeamZones = await this.prisma.teamZone.findMany({
      where: {
        teamId: awayTeamId,
        zone: {
          categoryId,
        },
      },
      include: {
        zone: {
          include: {
            category: true,
          },
        },
      },
    });

    if (homeTeamZones.length === 0) {
      throw new BadRequestException(
        'Home team is not assigned to any zone in this category',
      );
    }

    if (awayTeamZones.length === 0) {
      throw new BadRequestException(
        'Away team is not assigned to any zone in this category',
      );
    }

    // Verificar que ambos equipos están en la misma categoría
    const homeCategoryIds = homeTeamZones.map((tz) => tz.zone.categoryId);
    const awayCategoryIds = awayTeamZones.map((tz) => tz.zone.categoryId);

    const commonCategories = homeCategoryIds.filter((catId) =>
      awayCategoryIds.includes(catId),
    );

    if (commonCategories.length === 0) {
      throw new ConflictException(
        'Teams must be in the same category to play a match',
      );
    }
  }

  /**
   * Validar disponibilidad de cancha
   */
  private async validateVenueAvailability(
    venueId: string,
    matchDate: Date,
    excludeMatchId?: string,
  ): Promise<void> {
    const availability = await this.venuesService.checkAvailability(venueId, {
      date: matchDate.toISOString(),
      excludeMatchId,
    });

    if (!availability.available) {
      throw new ConflictException(
        `Venue is not available: ${availability.reason}`,
      );
    }
  }

  /**
   * Validar transiciones de estado permitidas
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: MatchStatus,
  ): void {
    const validTransitions: Record<string, MatchStatus[]> = {
      programado: [
        MatchStatus.EN_CURSO,
        MatchStatus.SUSPENDIDO,
        MatchStatus.CANCELADO,
        MatchStatus.REPROGRAMADO,
      ],
      en_curso: [
        MatchStatus.SUSPENDIDO,
        MatchStatus.CANCELADO,
        MatchStatus.FINALIZADO,
      ],
      suspendido: [
        MatchStatus.EN_CURSO,
        MatchStatus.CANCELADO,
        MatchStatus.REPROGRAMADO,
        MatchStatus.FINALIZADO,
      ],
      cancelado: [], // No se puede cambiar desde cancelado
      reprogramado: [MatchStatus.PROGRAMADO, MatchStatus.CANCELADO],
      finalizado: [], // No se puede cambiar desde finalizado
    };

    const allowedStatuses = validTransitions[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowedStatuses.join(', ')}`,
      );
    }
  }

  async create(createMatchDto: CreateMatchDto) {
    const isPlayoffMatch = this.isPlayoffMatchType(
      createMatchDto.matchType || MatchType.REGULAR,
    );

    // For regular matches, both teams are required
    if (!isPlayoffMatch) {
      if (!createMatchDto.homeTeamId || !createMatchDto.awayTeamId) {
        throw new BadRequestException(
          'Both home and away teams are required for regular matches',
        );
      }
    }

    let homeTeam: { id: string; sportId: string; name: string } | null = null;
    let awayTeam: { id: string; sportId: string; name: string } | null = null;

    // Verify teams exist if provided
    if (createMatchDto.homeTeamId) {
      homeTeam = await this.prisma.team.findUnique({
        where: { id: createMatchDto.homeTeamId, deletedAt: null },
      });
      if (!homeTeam) {
        throw new NotFoundException('Home team not found');
      }
    }

    if (createMatchDto.awayTeamId) {
      awayTeam = await this.prisma.team.findUnique({
        where: { id: createMatchDto.awayTeamId, deletedAt: null },
      });
      if (!awayTeam) {
        throw new NotFoundException('Away team not found');
      }
    }

    if (homeTeam && awayTeam) {
      if (homeTeam.id === awayTeam.id) {
        throw new BadRequestException('Home and away teams cannot be the same');
      }

      // Verify teams are from the same sport
      if (homeTeam.sportId !== awayTeam.sportId) {
        throw new BadRequestException('Teams must be from the same sport');
      }
    }

    // Validar categoría y zona si se proporcionan
    if (createMatchDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createMatchDto.categoryId, deletedAt: null },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // For regular matches with both teams, validate they're in the same category
      if (
        !isPlayoffMatch &&
        createMatchDto.homeTeamId &&
        createMatchDto.awayTeamId
      ) {
        await this.validateTeamsInSameCategory(
          createMatchDto.homeTeamId,
          createMatchDto.awayTeamId,
          createMatchDto.categoryId,
        );
      }

      // Si se proporciona zona, verificar que pertenece a la categoría
      if (createMatchDto.zoneId) {
        const zone = await this.prisma.zone.findUnique({
          where: { id: createMatchDto.zoneId, deletedAt: null },
        });

        if (!zone) {
          throw new NotFoundException('Zone not found');
        }

        if (zone.categoryId !== createMatchDto.categoryId) {
          throw new BadRequestException(
            'Zone must belong to the specified category',
          );
        }
      }
    }

    // Validar cancha y disponibilidad
    if (createMatchDto.venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: createMatchDto.venueId, deletedAt: null },
      });

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      if (!venue.isActive) {
        throw new BadRequestException('Venue is not active');
      }

      const matchDate = new Date(createMatchDto.matchDate);
      await this.validateVenueAvailability(createMatchDto.venueId, matchDate);
    }

    // Validar que no es amistoso si tiene categoría
    if (
      createMatchDto.matchType === MatchType.AMISTOSO &&
      createMatchDto.categoryId
    ) {
      throw new BadRequestException('Friendly matches cannot have a category');
    }

    const match = await this.prisma.match.create({
      data: {
        homeTeamId: createMatchDto.homeTeamId,
        awayTeamId: createMatchDto.awayTeamId,
        categoryId: createMatchDto.categoryId,
        zoneId: createMatchDto.zoneId,
        venueId: createMatchDto.venueId,
        matchTime: createMatchDto.matchTime,
        costPerTeam: createMatchDto.costPerTeam,
        status: createMatchDto.status || MatchStatus.PROGRAMADO,
        matchType: createMatchDto.matchType || MatchType.REGULAR,
        matchDate: new Date(createMatchDto.matchDate),
        homeScore: createMatchDto.homeScore ?? 0,
        awayScore: createMatchDto.awayScore ?? 0,
        // Playoff fields
        playoffRound: createMatchDto.playoffRound,
        playoffPosition: createMatchDto.playoffPosition,
        bracketPosition: createMatchDto.bracketPosition,
        homeSeed: createMatchDto.homeSeed,
        awaySeed: createMatchDto.awaySeed,
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
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        zone: true,
        venue: true,
        _count: {
          select: {
            announcements: true,
            matchStaff: true,
          },
        },
      },
    });

    const homeTeamName = homeTeam?.name || 'TBD';
    const awayTeamName = awayTeam?.name || 'TBD';
    this.logger.log(`Match created: ${homeTeamName} vs ${awayTeamName}`);

    return match;
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      status?: string;
      categoryId?: string;
      zoneId?: string;
      venueId?: string;
      matchType?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'matchDate',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.zoneId) {
      where.zoneId = filters.zoneId;
    }

    if (filters?.venueId) {
      where.venueId = filters.venueId;
    }

    if (filters?.matchType) {
      where.matchType = filters.matchType;
    }

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          zone: true,
          venue: true,
          _count: {
            select: {
              announcements: true,
              matchStaff: true,
            },
          },
        },
      }),
      this.prisma.match.count({ where }),
    ]);

    return {
      data: matches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id, deletedAt: null },
      include: {
        homeTeam: {
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
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        awayTeam: {
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
                firstName: true,
                lastName: true,
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
                status: true,
              },
            },
            sport: true,
          },
        },
        zone: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        venue: true,
        announcements: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        matchStaff: {
          include: {
            staff: true,
            assignor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            announcements: true,
            matchStaff: true,
            payments: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const match = await this.findOne(id);

    // Validar equipos si se están actualizando
    if (updateMatchDto.homeTeamId || updateMatchDto.awayTeamId) {
      const homeTeamId = updateMatchDto.homeTeamId || match.homeTeamId;
      const awayTeamId = updateMatchDto.awayTeamId || match.awayTeamId;

      if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
        throw new BadRequestException('Home and away teams cannot be the same');
      }

      if (homeTeamId && awayTeamId) {
        const [homeTeam, awayTeam] = await Promise.all([
          this.prisma.team.findUnique({
            where: { id: homeTeamId, deletedAt: null },
          }),
          this.prisma.team.findUnique({
            where: { id: awayTeamId, deletedAt: null },
          }),
        ]);

        if (!homeTeam || !awayTeam) {
          throw new NotFoundException('Team not found');
        }

        if (homeTeam.sportId !== awayTeam.sportId) {
          throw new BadRequestException('Teams must be from the same sport');
        }

        // Validar categoría si existe
        const categoryId = updateMatchDto.categoryId || match.categoryId;
        if (categoryId) {
          await this.validateTeamsInSameCategory(
            homeTeamId,
            awayTeamId,
            categoryId,
          );
        }
      }
    }

    // Validar cancha y disponibilidad si se está actualizando
    if (updateMatchDto.venueId || updateMatchDto.matchDate) {
      const venueId = updateMatchDto.venueId || match.venueId;
      const matchDate = updateMatchDto.matchDate
        ? new Date(updateMatchDto.matchDate)
        : match.matchDate;

      if (venueId) {
        await this.validateVenueAvailability(venueId, matchDate, id);
      }
    }

    // Validar transición de estado si se está cambiando
    if (updateMatchDto.status) {
      this.validateStatusTransition(match.status, updateMatchDto.status);
    }

    const updatedMatch = await this.prisma.match.update({
      where: { id },
      data: {
        ...updateMatchDto,
        matchDate: updateMatchDto.matchDate
          ? new Date(updateMatchDto.matchDate)
          : undefined,
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
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        zone: true,
        venue: true,
        _count: {
          select: {
            announcements: true,
            matchStaff: true,
          },
        },
      },
    });

    this.logger.log(`Match updated: ${id}`);

    return updatedMatch;
  }

  async changeStatus(id: string, changeStatusDto: ChangeMatchStatusDto) {
    const match = await this.findOne(id);

    this.validateStatusTransition(match.status, changeStatusDto.status);

    const updatedMatch = await this.prisma.match.update({
      where: { id },
      data: {
        status: changeStatusDto.status,
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
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        zone: true,
        venue: true,
        _count: {
          select: {
            announcements: true,
            matchStaff: true,
          },
        },
      },
    });

    this.logger.log(`Match status changed: ${id} -> ${changeStatusDto.status}`);

    // If playoff match is finalized, advance winner in bracket
    if (
      changeStatusDto.status === MatchStatus.FINALIZADO &&
      this.isPlayoffMatchType(updatedMatch.matchType)
    ) {
      try {
        await this.playoffGenerator.advanceWinner(id);
        this.logger.log(`Advanced winner for playoff match ${id}`);
      } catch (error) {
        this.logger.warn(
          `Failed to advance winner for match ${id}: ${error.message}`,
        );
      }
    }

    return updatedMatch;
  }

  /**
   * Check if match type is a playoff type
   */
  private isPlayoffMatchType(matchType: string): boolean {
    return ['playoff', 'semifinal', 'final', 'third_place'].includes(matchType);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.match.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Match deleted: ${id}`);

    return { message: 'Match deleted successfully' };
  }

  /**
   * Crear comunicado de partido
   */
  async createAnnouncement(
    matchId: string,
    createAnnouncementDto: CreateAnnouncementDto,
    createdBy: string,
  ) {
    const match = await this.findOne(matchId);

    const announcement = await this.prisma.matchAnnouncement.create({
      data: {
        ...createAnnouncementDto,
        matchId,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        match: {
          select: {
            id: true,
            homeTeam: {
              select: {
                name: true,
              },
            },
            awayTeam: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `Announcement created for match ${matchId}: ${createAnnouncementDto.type}`,
    );

    return announcement;
  }

  /**
   * Obtener comunicados de un partido
   */
  async getAnnouncements(matchId: string) {
    await this.findOne(matchId);

    const announcements = await this.prisma.matchAnnouncement.findMany({
      where: { matchId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return announcements;
  }
}
