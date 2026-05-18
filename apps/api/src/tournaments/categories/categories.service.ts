import {
  HttpStatus,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { generateUniqueSlug } from '../../common/utils/slug.util';
import { BusinessError, ErrorCode } from '../../common/errors';
import { SportRulesRegistry } from '../../common/sport-rules/sport-rules.registry';
import {
  Modality,
  SportCode,
} from '../../common/sport-rules/sport-rules.types';
import {
  isPlayoffConfigEditable,
  validatePlayoffFormatJson,
  validateZonesCount,
} from './domain/rules/playoff-config.rules';
import { LinkCategoryLevelUseCase } from './application/use-cases/link-category-level.use-case';

/**
 * Campos extendidos de creación/edición que pueden venir además de los
 * declarados en `CreateCategoryDto` / `UpdateCategoryDto` (DTOs heredados
 * con class-validator). Se aceptan opcionalmente desde el body — el controller
 * los pasa tal cual.
 *
 * Cuando W1.x estabilice los DTOs en `@overtime-mono/shared`, se mueven allá.
 */
export interface CategoryPlayoffConfigPatch {
  categoryLevelId?: string | null;
  zonesCount?: number;
  qualifierCount?: number | null;
  qualifiersPerZone?: number | null;
  hasPlayIn?: boolean;
  hasThirdPlaceMatch?: boolean;
  playoffFormatByRound?: Record<string, string> | null;
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sportRules: SportRulesRegistry,
    private readonly linkCategoryLevel: LinkCategoryLevelUseCase,
  ) {}

  private assertFixtureVisibleForPublic(
    tournamentStatus: string,
    currentUserRole?: string | null,
  ): void {
    const isAdmin =
      currentUserRole === 'admin' || currentUserRole === 'master';
    if (isAdmin) return;

    if (
      tournamentStatus === 'PLAYING' ||
      tournamentStatus === 'FINISHED' ||
      tournamentStatus === 'ARCHIVED'
    ) {
      return;
    }

    throw new BusinessError(
      ErrorCode.FIXTURE_NOT_PUBLISHED,
      'El fixture todavia no esta publicado',
      HttpStatus.CONFLICT,
    );
  }

  private async generateCategorySlug(
    name: string,
    tournamentId: string,
    excludeId?: string,
  ): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        const existing = await this.prisma.category.findFirst({
          where: {
            tournamentId,
            slug,
            deletedAt: null,
            ...(excludeId ? { id: { not: excludeId } } : {}),
          },
        });
        return !!existing;
      },
    });
  }

  async findByTournamentSlugAndCategorySlug(
    tournamentSlug: string,
    categorySlug: string,
  ) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { slug: tournamentSlug, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament not found`);
    }

    const category = await this.prisma.category.findFirst({
      where: {
        tournamentId: tournament.id,
        slug: categorySlug,
        deletedAt: null,
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        zones: true,
        _count: {
          select: {
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    return category;
  }

  async create(
    createCategoryDto: CreateCategoryDto & CategoryPlayoffConfigPatch,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: createCategoryDto.tournamentId, deletedAt: null },
      select: { id: true, sportId: true, modality: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // RN-044 — si se vincula categoryLevel, validar mismo sport.
    if (createCategoryDto.categoryLevelId) {
      await this.linkCategoryLevel.execute({
        categoryLevelId: createCategoryDto.categoryLevelId,
        tournamentId: tournament.id,
      });
    }

    // DP-003 — validar zonesCount si vino.
    if (createCategoryDto.zonesCount !== undefined) {
      const err = validateZonesCount(createCategoryDto.zonesCount);
      if (err) {
        throw new BusinessError(
          ErrorCode.CATEGORY_TOO_MANY_ZONES,
          err,
          HttpStatus.BAD_REQUEST,
          { zonesCount: createCategoryDto.zonesCount },
        );
      }
    }

    // RN-047 — validar JSON de playoffs si vino.
    if (createCategoryDto.playoffFormatByRound !== undefined) {
      const err = validatePlayoffFormatJson(
        createCategoryDto.playoffFormatByRound,
      );
      if (err) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          err,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const slug = await this.generateCategorySlug(
      createCategoryDto.name,
      createCategoryDto.tournamentId,
    );

    // RN-047 / DP-001 — si no viene playoffFormatByRound, usar el default
    // sugerido por la strategy del deporte/modalidad.
    const playoffFormatByRound = this.resolvePlayoffFormatForCreate(
      tournament.modality,
      createCategoryDto.playoffFormatByRound,
    );

    const data: Prisma.CategoryCreateInput = {
      name: createCategoryDto.name,
      slug,
      tournament: { connect: { id: createCategoryDto.tournamentId } },
      ...(createCategoryDto.maxTeams !== undefined && {
        maxTeams: createCategoryDto.maxTeams,
      }),
      ...(createCategoryDto.teamsPerZone !== undefined && {
        teamsPerZone: createCategoryDto.teamsPerZone,
      }),
      ...(createCategoryDto.status !== undefined && {
        status: createCategoryDto.status,
      }),
      ...(createCategoryDto.substatus !== undefined && {
        substatus: createCategoryDto.substatus,
      }),
      ...(createCategoryDto.categoryLevelId && {
        categoryLevel: { connect: { id: createCategoryDto.categoryLevelId } },
      }),
      ...(createCategoryDto.zonesCount !== undefined && {
        zonesCount: createCategoryDto.zonesCount,
      }),
      ...(createCategoryDto.qualifierCount !== undefined && {
        qualifierCount: createCategoryDto.qualifierCount,
      }),
      ...(createCategoryDto.qualifiersPerZone !== undefined && {
        qualifiersPerZone: createCategoryDto.qualifiersPerZone,
      }),
      ...(createCategoryDto.hasPlayIn !== undefined && {
        hasPlayIn: createCategoryDto.hasPlayIn,
      }),
      ...(createCategoryDto.hasThirdPlaceMatch !== undefined && {
        hasThirdPlaceMatch: createCategoryDto.hasThirdPlaceMatch,
      }),
      playoffFormatByRound:
        playoffFormatByRound === null
          ? Prisma.JsonNull
          : (playoffFormatByRound as Prisma.InputJsonValue),
    };

    const category = await this.prisma.category.create({
      data,
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        zones: true,
        _count: {
          select: {
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Category created: ${category.name}`);

    return category;
  }

  /**
   * Si el caller pasa explícitamente el JSON de playoffs lo respetamos
   * (incluso vacío). Si no lo pasa, sembramos los defaults del deporte/modalidad
   * para que las nuevas categorías queden listas con BO sensatos.
   */
  private resolvePlayoffFormatForCreate(
    tournamentModality: string | null,
    incoming: Record<string, string> | null | undefined,
  ): Record<string, string> | null {
    if (incoming !== undefined) {
      return incoming;
    }
    const sportCode: SportCode = 'BASKETBALL';
    const modality = (tournamentModality as Modality | null) ?? '5v5';
    const rules = this.sportRules.tryGet(sportCode, modality);
    if (!rules) return null;
    return { ...rules.playoff.defaultFormatByRound };
  }

  async findAll(tournamentId: string, paginationDto: PaginationDto) {
    // Verificar que el torneo existe
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          tournamentId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tournament: { select: { id: true, name: true, sportId: true } },
          zones: {
            include: {
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
      }),
      this.prisma.category.count({
        where: {
          tournamentId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            sportId: true,
          },
        },
        zones: {
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
        },
        registrations: {
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
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto & CategoryPlayoffConfigPatch,
  ) {
    const existing = await this.findOne(id);

    // RN-044 — si se cambia categoryLevel, validar mismo sport.
    if (updateCategoryDto.categoryLevelId) {
      await this.linkCategoryLevel.execute({
        categoryLevelId: updateCategoryDto.categoryLevelId,
        tournamentId: existing.tournamentId,
      });
    }

    // RN-047 — los campos de playoffs solo se pueden tocar si la categoría
    // todavía no entró en PLAYOFFS_FASE.
    const touchesPlayoffConfig =
      updateCategoryDto.zonesCount !== undefined ||
      updateCategoryDto.qualifierCount !== undefined ||
      updateCategoryDto.qualifiersPerZone !== undefined ||
      updateCategoryDto.hasPlayIn !== undefined ||
      updateCategoryDto.hasThirdPlaceMatch !== undefined ||
      updateCategoryDto.playoffFormatByRound !== undefined;

    if (touchesPlayoffConfig && !isPlayoffConfigEditable(existing.substatus)) {
      throw new BusinessError(
        ErrorCode.CATEGORY_PLAYOFF_FORMAT_LOCKED,
        'No se puede editar la configuración de playoffs porque la categoría ya está en fase de playoffs.',
        HttpStatus.CONFLICT,
        { categoryId: id },
      );
    }

    if (updateCategoryDto.zonesCount !== undefined) {
      const err = validateZonesCount(updateCategoryDto.zonesCount);
      if (err) {
        throw new BusinessError(
          ErrorCode.CATEGORY_TOO_MANY_ZONES,
          err,
          HttpStatus.BAD_REQUEST,
          { zonesCount: updateCategoryDto.zonesCount },
        );
      }
    }

    if (updateCategoryDto.playoffFormatByRound !== undefined) {
      const err = validatePlayoffFormatJson(
        updateCategoryDto.playoffFormatByRound,
      );
      if (err) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          err,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (updateCategoryDto.name !== undefined) data.name = updateCategoryDto.name;
    if (updateCategoryDto.maxTeams !== undefined)
      data.maxTeams = updateCategoryDto.maxTeams;
    if (updateCategoryDto.teamsPerZone !== undefined)
      data.teamsPerZone = updateCategoryDto.teamsPerZone;
    if (updateCategoryDto.status !== undefined)
      data.status = updateCategoryDto.status;
    if (updateCategoryDto.substatus !== undefined)
      data.substatus = updateCategoryDto.substatus;

    if (updateCategoryDto.categoryLevelId !== undefined) {
      data.categoryLevel =
        updateCategoryDto.categoryLevelId === null
          ? { disconnect: true }
          : { connect: { id: updateCategoryDto.categoryLevelId } };
    }
    if (updateCategoryDto.zonesCount !== undefined)
      data.zonesCount = updateCategoryDto.zonesCount;
    if (updateCategoryDto.qualifierCount !== undefined)
      data.qualifierCount = updateCategoryDto.qualifierCount;
    if (updateCategoryDto.qualifiersPerZone !== undefined)
      data.qualifiersPerZone = updateCategoryDto.qualifiersPerZone;
    if (updateCategoryDto.hasPlayIn !== undefined)
      data.hasPlayIn = updateCategoryDto.hasPlayIn;
    if (updateCategoryDto.hasThirdPlaceMatch !== undefined)
      data.hasThirdPlaceMatch = updateCategoryDto.hasThirdPlaceMatch;
    if (updateCategoryDto.playoffFormatByRound !== undefined) {
      data.playoffFormatByRound =
        updateCategoryDto.playoffFormatByRound === null
          ? Prisma.JsonNull
          : (updateCategoryDto.playoffFormatByRound as Prisma.InputJsonValue);
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== existing.name) {
      data.slug = await this.generateCategorySlug(
        updateCategoryDto.name,
        existing.tournamentId,
        id,
      );
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data,
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        zones: true,
        _count: {
          select: {
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Category updated: ${updatedCategory.name}`);

    return updatedCategory;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Category deleted: ${id}`);

    return { message: 'Category deleted successfully' };
  }

  /**
   * BE-MOCK-003 — tabla de posiciones por zona de la categoría.
   *
   * Calcula on-the-fly a partir de los matches finalizados de tipo `regular`
   * (la tabla es de fase regular; playoffs/amistosos no cuentan).
   *
   * Reglas FIBA (RN-018):
   *  - Siempre hay ganador → no hay empate.
   *  - PG suma 2 pts, PP suma 1 pt.
   *  - Orden: puntos desc, DP desc, PF desc.
   *
   * Si la categoría no existe → 404.
   * Si no tiene zonas → `{ zones: [] }`.
   * Si una zona no tiene teams → `{ ..., standings: [] }`.
   */
  async computeStandings(categoryId: string, currentUserRole?: string | null) {
    // 1) 404 si la categoría no existe (o está soft-deleted).
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      select: {
        id: true,
        tournament: { select: { status: true } },
      },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    this.assertFixtureVisibleForPublic(
      category.tournament.status,
      currentUserRole,
    );

    // 2) Cargar zonas con sus teams + matches finalizados de fase regular.
    //    El filtro por `matchType: 'regular'` y `status: 'finalizado'` se aplica
    //    en la query para no traer playoffs ni programados.
    const zones = await this.prisma.zone.findMany({
      where: { categoryId, deletedAt: null },
      orderBy: { name: 'asc' },
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
        matches: {
          where: {
            deletedAt: null,
            status: 'finalizado',
            matchType: 'regular',
          },
          select: {
            homeTeamId: true,
            awayTeamId: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
    });

    // 3) Por zona: armar acumulador por team y recorrer matches.
    type Row = {
      position: number;
      teamId: string;
      teamName: string;
      teamLogo: string | null;
      played: number;
      won: number;
      lost: number;
      pointsFor: number;
      pointsAgainst: number;
      diff: number;
      points: number;
    };

    const result = zones.map((zone) => {
      const rows = new Map<string, Row>();

      for (const tz of zone.teamZones) {
        rows.set(tz.team.id, {
          position: 0,
          teamId: tz.team.id,
          teamName: tz.team.name,
          teamLogo: tz.team.logoUrl,
          played: 0,
          won: 0,
          lost: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          diff: 0,
          points: 0,
        });
      }

      for (const match of zone.matches) {
        const { homeTeamId, awayTeamId, homeScore, awayScore } = match;
        if (!homeTeamId || !awayTeamId) continue;

        const home = rows.get(homeTeamId);
        const away = rows.get(awayTeamId);
        // Defensivo: si un match referencia un team que no está en la zona
        // (no debería pasar), lo ignoramos para no contaminar la tabla.
        if (!home || !away) continue;

        home.played += 1;
        away.played += 1;
        home.pointsFor += homeScore;
        home.pointsAgainst += awayScore;
        away.pointsFor += awayScore;
        away.pointsAgainst += homeScore;

        if (homeScore > awayScore) {
          home.won += 1;
          away.lost += 1;
        } else if (awayScore > homeScore) {
          away.won += 1;
          home.lost += 1;
        }
        // FIBA: no hay empate; si llegara a venir, no sumamos PG/PP a nadie.
      }

      const standings = Array.from(rows.values()).map((r) => ({
        ...r,
        diff: r.pointsFor - r.pointsAgainst,
        points: 2 * r.won + 1 * r.lost,
      }));

      // Orden: puntos desc, DP desc, PF desc.
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.diff !== a.diff) return b.diff - a.diff;
        return b.pointsFor - a.pointsFor;
      });

      standings.forEach((s, idx) => {
        s.position = idx + 1;
      });

      return {
        id: zone.id,
        name: zone.name,
        standings,
      };
    });

    return { zones: result };
  }

  /**
   * BE-MOCK-002 — `GET /categories/:categoryId/fixture`
   *
   * Devuelve los matches de fase regular de la categoría agrupados por
   * "ronda". Hoy no existe `Match.roundNumber` en el schema (ver
   * docs/be-proposals-mocks.md §BE-MOCK-002 opción A) así que usamos el
   * `matchDate` (día calendario) como proxy: cada fecha distinta es una ronda.
   *
   * El nombre de la ronda se asigna como "Fecha N" según el orden cronológico
   * (1 = más temprana). Cuando se sume `roundNumber` se reemplaza por el valor
   * real y permite tener varios días en la misma ronda.
   */
  async getFixture(categoryId: string, currentUserRole?: string | null) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      select: {
        id: true,
        tournament: { select: { status: true } },
      },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    this.assertFixtureVisibleForPublic(
      category.tournament.status,
      currentUserRole,
    );

    const matches = await this.prisma.match.findMany({
      where: {
        categoryId,
        deletedAt: null,
        matchType: 'regular',
        status: { in: ['programado', 'reprogramado', 'finalizado', 'en_curso', 'suspendido'] },
      },
      orderBy: { matchDate: 'asc' },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        venue: { select: { id: true, name: true } },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            tournament: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    const dayKey = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

    type Bucket = { key: string; date: Date; matches: typeof matches };
    const buckets: Bucket[] = [];
    const byKey = new Map<string, Bucket>();
    for (const m of matches) {
      const k = dayKey(m.matchDate);
      let bucket = byKey.get(k);
      if (!bucket) {
        bucket = { key: k, date: m.matchDate, matches: [] };
        byKey.set(k, bucket);
        buckets.push(bucket);
      }
      bucket.matches.push(m);
    }

    const rounds = buckets.map((bucket, idx) => ({
      name: `Fecha ${idx + 1}`,
      date: bucket.date.toISOString(),
      matches: bucket.matches.map((m) => {
        const hasResult = m.status === 'finalizado';
        return {
          id: m.id,
          tournamentSlug: m.category?.tournament?.slug ?? null,
          categorySlug: m.category?.slug ?? null,
          date: m.matchDate.toISOString(),
          location: m.venue?.name ?? null,
          matchType: m.matchType,
          team1: m.homeTeam
            ? {
                id: m.homeTeam.id,
                name: m.homeTeam.name,
                logoUrl: m.homeTeam.logoUrl,
              }
            : null,
          team2: m.awayTeam
            ? {
                id: m.awayTeam.id,
                name: m.awayTeam.name,
                logoUrl: m.awayTeam.logoUrl,
              }
            : null,
          team1Score: hasResult ? m.homeScore : null,
          team2Score: hasResult ? m.awayScore : null,
        };
      }),
    }));

    return { rounds };
  }
}
