import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  DebtStatus,
  DebtType,
  MediaCategory,
  MediaVisibility,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { readFechasState } from '../../../sanctions/domain/rules/fechas-counting.rules';
import type {
  CreateFranchiseSchemaDto,
  AddPlayerSchemaDto,
  CreateTeamSchemaDto,
  PaginationSchemaDto,
  TeamRosterStatusDto,
  UpdateTeamSchemaDto,
} from '@overtime-mono/shared';
import { generateUniqueSlug } from '../../../common/utils/slug.util';
import { EligibilityService } from '../../../eligibility/eligibility.service';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import {
  Modality,
  SportCode,
} from '../../../common/sport-rules/sport-rules.types';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: EligibilityService,
    private readonly mediaAssets: MediaAssetService,
    private readonly sportRules: SportRulesRegistry,
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
    // RN-034 — DNI obligatorio y validado para crear equipo.
    const creator = await this.prisma.profile.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        documentNumber: true,
        documentVerified: true,
      },
    });
    if (!creator) {
      throw new NotFoundException('Creator profile not found');
    }
    if (!creator.documentNumber) {
      throw new BusinessError(
        ErrorCode.PROFILE_DNI_REQUIRED,
        'Debés cargar tu DNI antes de crear un equipo (RN-034)',
        HttpStatus.FORBIDDEN,
      );
    }
    if (!creator.documentVerified) {
      throw new BusinessError(
        ErrorCode.PROFILE_DNI_NOT_VERIFIED,
        'Tu DNI todavía no fue validado por la organización (RN-034)',
        HttpStatus.FORBIDDEN,
      );
    }

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
        franchise: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
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

    // RN-002 — un jugador no puede pertenecer activamente a otro equipo del mismo deporte.
    const conflictingMembership = await this.prisma.profileTeam.findFirst({
      where: {
        profileId: addPlayerDto.profileId,
        isActive: true,
        teamId: { not: teamId },
        team: {
          sportId: team.sportId,
          deletedAt: null,
        },
      },
      include: {
        team: {
          select: { id: true, name: true, sportId: true },
        },
      },
    });
    if (conflictingMembership) {
      throw new BusinessError(
        ErrorCode.TEAM_PLAYER_ALREADY_IN_OTHER_TEAM,
        `El jugador ya pertenece al equipo "${conflictingMembership.team.name}" en el mismo deporte (RN-002)`,
        HttpStatus.CONFLICT,
        {
          profileId: addPlayerDto.profileId,
          conflictingTeamId: conflictingMembership.team.id,
          sportId: team.sportId,
        },
      );
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

  /**
   * RN-009 — devuelve el estado de la lista de buena fe para una modalidad.
   * `Team` no tiene modality propia; el llamador debe especificarla
   * (típicamente la modalidad del torneo destino).
   */
  async getRosterStatus(
    teamId: string,
    modality: Modality,
  ): Promise<TeamRosterStatusDto> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        sport: { select: { code: true } },
      },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const sportCode = team.sport.code as SportCode;
    const rules = this.sportRules.tryGet(sportCode, modality);
    if (!rules) {
      throw new BusinessError(
        ErrorCode.SPORT_RULES_NOT_FOUND,
        `No hay reglas para sport="${sportCode}" modality="${modality}"`,
        HttpStatus.BAD_REQUEST,
        { sportCode, modality },
      );
    }

    const count = await this.prisma.profileTeam.count({
      where: { teamId, isActive: true },
    });

    const { rosterMin, rosterMax } = rules.roster;
    const isValid = count >= rosterMin && count <= rosterMax;

    return {
      teamId,
      modality,
      count,
      min: rosterMin,
      max: rosterMax,
      isValid,
    };
  }

  /**
   * Sube el logo del equipo (PUBLIC bucket vía MediaAssetService).
   * Reemplaza un asset previo si existía (soft-delete del anterior).
   */
  async uploadLogo(
    teamId: string,
    uploaderId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    },
  ): Promise<{ assetId: string; url: string }> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true, name: true, logoAssetId: true },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    if (!file?.buffer || file.buffer.length === 0) {
      throw new BusinessError(
        ErrorCode.MEDIA_UPLOAD_FAILED,
        'Archivo de logo vacío o inválido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const asset = await this.mediaAssets.upload({
      uploadedByProfileId: uploaderId,
      category: MediaCategory.TEAM_LOGO,
      visibility: MediaVisibility.PUBLIC,
      contentType: file.mimetype,
      originalFilename: file.originalname,
      body: file.buffer,
      pathPrefix: `team-logos/${teamId}`,
      metadata: { teamId },
    });

    const previousAssetId = team.logoAssetId;

    await this.prisma.team.update({
      where: { id: teamId },
      data: { logoAssetId: asset.id },
    });

    if (previousAssetId && previousAssetId !== asset.id) {
      try {
        await this.mediaAssets.delete(previousAssetId);
      } catch (err) {
        this.logger.warn(
          `Failed to delete previous logo asset ${previousAssetId} for team ${teamId}`,
        );
      }
    }

    const url = await this.mediaAssets.getAccessUrl(asset);

    this.logger.log(`Logo uploaded for team ${team.name} (${teamId})`);

    return { assetId: asset.id, url };
  }

  /**
   * Devuelve el último partido finalizado y/o el próximo programado del team,
   * con relaciones tournament/category/venue/teams pobladas para que el FE
   * no tenga que hacer llamadas adicionales (consume `MatchPreviewData`).
   *
   * - `type='last'` → solo `lastMatch`.
   * - `type='next'` → solo `nextMatch`.
   * - sin `type` → ambos.
   *
   * RN: No filtra por `matchType` — incluye partidos regulares, playoff y amistosos
   * (todos los oficiales del team). Si en el futuro se quiere distinguir, agregar un
   * filtro `?matchType=regular`.
   */
  async findTeamMatches(teamId: string, type?: 'last' | 'next') {
    // Verificamos que el team exista (404 si no).
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    const include = {
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
    } as const;

    const teamFilter = {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      deletedAt: null,
    };

    const wantsLast = !type || type === 'last';
    const wantsNext = !type || type === 'next';

    const [last, next] = await Promise.all([
      wantsLast
        ? this.prisma.match.findFirst({
            where: { ...teamFilter, status: 'finalizado' },
            orderBy: { matchDate: 'desc' },
            include,
          })
        : Promise.resolve(null),
      wantsNext
        ? this.prisma.match.findFirst({
            where: { ...teamFilter, status: { in: ['programado', 'reprogramado'] } },
            orderBy: { matchDate: 'asc' },
            include,
          })
        : Promise.resolve(null),
    ]);

    return {
      lastMatch: last ? this.toMatchPreview(last) : null,
      nextMatch: next ? this.toMatchPreview(next) : null,
    };
  }

  private toMatchPreview(match: {
    id: string;
    matchDate: Date;
    matchType: string;
    homeScore: number;
    awayScore: number;
    homeTeam: { id: string; name: string; logoUrl: string | null } | null;
    awayTeam: { id: string; name: string; logoUrl: string | null } | null;
    venue: { id: string; name: string } | null;
    category: {
      id: string;
      name: string;
      slug: string | null;
      tournament: { id: string; name: string; slug: string } | null;
    } | null;
    status: string;
  }) {
    const hasResult = match.status === 'finalizado';
    return {
      id: match.id,
      tournamentSlug: match.category?.tournament?.slug ?? null,
      categorySlug: match.category?.slug ?? null,
      date: match.matchDate.toISOString(),
      location: match.venue?.name ?? null,
      matchType: match.matchType,
      team1: match.homeTeam
        ? {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logoUrl: match.homeTeam.logoUrl,
          }
        : null,
      team2: match.awayTeam
        ? {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logoUrl: match.awayTeam.logoUrl,
          }
        : null,
      team1Score: hasResult ? match.homeScore : null,
      team2Score: hasResult ? match.awayScore : null,
    };
  }

  /**
   * BE-MOCK-004 — Estado financiero y disciplinario consolidado del equipo.
   *
   * Auth: solo admin/master, el creator del team o el captain pueden consultarlo.
   * Cualquier otro currentUser → ForbiddenException.
   *
   * Devuelve:
   *  - totalDebt: suma de `currentBalance` de Debts del team con status no terminal
   *    (excluye PAID, CANCELLED y los DELETED_*).
   *  - totalPaid: suma de Payment.amount con status=procesado, scopeados al team
   *    (debt.teamId === team o registration.teamId === team).
   *  - pendingConfirmation: ídem pero con status pendiente | procesando
   *    (proxy del estado "voucher subido pero todavía no confirmado por admin").
   *  - registrations[]: por cada Registration del team, agrupa sus Debts y Payments
   *    y deriva inscriptionAmount/insuranceAmount/paidAmount/status/voucherUrl.
   *  - suspensions[]: sanciones DISCIPLINARY ACTIVE de profiles que están en el roster
   *    activo del team. totalGames/remainingGames se leen del marcador embebido en
   *    `notes` (RN-003 / fechas-counting.rules.ts).
   *
   * El shape se alinea con `TeamBalance` del FE (apps/web/modules/team/TeamBalanceService.ts).
   */
  async getBalance(
    teamId: string,
    currentUserId: string,
    currentUserRole: string | null | undefined,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true, creatorId: true, captainId: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const isAdmin =
      currentUserRole === 'admin' || currentUserRole === 'master';
    const isCreator = team.creatorId === currentUserId;
    const isCaptain = team.captainId === currentUserId;
    if (!isAdmin && !isCreator && !isCaptain) {
      throw new ForbiddenException(
        'Solo admin/master, el creador o el capitán del equipo pueden ver el balance',
      );
    }

    // Debts del team que todavía generan saldo (status no terminal).
    const NON_TERMINAL_DEBT_STATUSES: DebtStatus[] = [
      DebtStatus.APPROVED,
      DebtStatus.PARTIALLY_PAID,
    ];

    // Una sola query para todas las Debts del team — luego agrupamos en memoria
    // para construir totales globales y desgloses por registration.
    const debts = await this.prisma.debt.findMany({
      where: {
        teamId,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        status: true,
        originAmount: true,
        currentBalance: true,
        registrationId: true,
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Acumuladores globales.
    const decimalToNumber = (d: Prisma.Decimal): number => Number(d.toString());

    let totalDebt = 0;
    let totalPaid = 0;
    let pendingConfirmation = 0;

    for (const debt of debts) {
      if (NON_TERMINAL_DEBT_STATUSES.includes(debt.status)) {
        totalDebt += decimalToNumber(debt.currentBalance);
      }
      for (const p of debt.payments) {
        if (p.status === 'procesado') {
          totalPaid += p.amount;
        } else if (p.status === 'pendiente' || p.status === 'procesando') {
          pendingConfirmation += p.amount;
        }
      }
    }

    // Agrupar debts por registrationId (las que no tienen registration quedan fuera
    // del array `registrations[]` pero ya impactaron en los totales globales).
    const debtsByRegistration = new Map<string, typeof debts>();
    for (const debt of debts) {
      if (!debt.registrationId) continue;
      const list = debtsByRegistration.get(debt.registrationId) ?? [];
      list.push(debt);
      debtsByRegistration.set(debt.registrationId, list);
    }

    const registrationRecords = await this.prisma.registration.findMany({
      where: { teamId },
      select: {
        id: true,
        tournament: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    // playersCount es un proxy del roster actual del team (no hay snapshot por
    // registration en el schema). TODO: si en el futuro RegistrationRosterEntry
    // se materializa por inscripción, derivar de ahí en lugar del roster activo.
    const activePlayersCount = await this.prisma.profileTeam.count({
      where: { teamId, isActive: true },
    });

    // Para resolver voucherUrl tomamos el último Payment con un MediaAsset
    // category=PAYMENT_PROOF asociado vía metadata.paymentId. Buscamos los
    // assets en una sola query y los mapeamos por paymentId.
    const allPaymentIds = debts.flatMap((d) => d.payments.map((p) => p.id));
    const proofAssets = allPaymentIds.length
      ? await this.prisma.mediaAsset.findMany({
          where: {
            category: MediaCategory.PAYMENT_PROOF,
            deletedAt: null,
            metadata: { path: ['paymentId'], string_contains: '' },
          },
          select: {
            id: true,
            bucket: true,
            storageKey: true,
            metadata: true,
            createdAt: true,
          },
        })
      : [];
    const voucherByPaymentId = new Map<string, { url: string; createdAt: Date }>();
    for (const asset of proofAssets) {
      const meta = asset.metadata as { paymentId?: string } | null;
      const pid = meta?.paymentId;
      if (!pid || !allPaymentIds.includes(pid)) continue;
      // URL pública estable: `${bucket}/${storageKey}` — el FE puede pedir un
      // signed URL al endpoint de media si hace falta (asset es PRIVATE).
      // TODO: si el FE necesita signed URL, exponer un /media/:assetId/url
      //       y devolver ese path acá.
      const url = `${asset.bucket}/${asset.storageKey}`;
      const existing = voucherByPaymentId.get(pid);
      if (!existing || existing.createdAt < asset.createdAt) {
        voucherByPaymentId.set(pid, { url, createdAt: asset.createdAt });
      }
    }

    const registrations = registrationRecords.map((reg) => {
      const regDebts = debtsByRegistration.get(reg.id) ?? [];

      // TODO: si en el futuro INSURANCE convive con LATE_ROSTER_FEE u otros tipos
      //       per-jugador, considerar agruparlos. Por ahora: REGISTRATION_FEE
      //       e INSURANCE son los conceptos base de una inscripción.
      const inscriptionAmount = regDebts
        .filter((d) => d.type === DebtType.REGISTRATION_FEE)
        .reduce((acc, d) => acc + decimalToNumber(d.originAmount), 0);
      const insuranceAmount = regDebts
        .filter((d) => d.type === DebtType.INSURANCE)
        .reduce((acc, d) => acc + decimalToNumber(d.originAmount), 0);

      const totalAmount = inscriptionAmount + insuranceAmount;

      let regPaidAmount = 0;
      let regPendingAmount = 0;
      let latestPendingVoucher: { url: string; createdAt: Date } | null = null;
      let latestApprovedVoucher: { url: string; createdAt: Date } | null = null;
      for (const debt of regDebts) {
        for (const p of debt.payments) {
          const v = voucherByPaymentId.get(p.id) ?? null;
          if (p.status === 'procesado') {
            regPaidAmount += p.amount;
            if (
              v &&
              (!latestApprovedVoucher ||
                latestApprovedVoucher.createdAt < v.createdAt)
            ) {
              latestApprovedVoucher = v;
            }
          } else if (p.status === 'pendiente' || p.status === 'procesando') {
            regPendingAmount += p.amount;
            if (
              v &&
              (!latestPendingVoucher ||
                latestPendingVoucher.createdAt < v.createdAt)
            ) {
              latestPendingVoucher = v;
            }
          }
        }
      }

      // Status derivado: si todas las debts de la registration están PAID o no
      // hay saldo, "paid". Si hay vouchers pendientes de confirmación,
      // "voucher_sent". Si no, "pending_payment".
      const allPaidOrNoDebts =
        regDebts.length > 0 &&
        regDebts.every(
          (d) =>
            d.status === DebtStatus.PAID ||
            d.status === DebtStatus.CANCELLED ||
            d.status === DebtStatus.DELETED_BY_ERROR ||
            d.status === DebtStatus.DELETED_WITH_RECORD,
        );

      let status: 'pending_payment' | 'voucher_sent' | 'paid';
      if (allPaidOrNoDebts) {
        status = 'paid';
      } else if (regPendingAmount > 0 || latestPendingVoucher) {
        status = 'voucher_sent';
      } else {
        status = 'pending_payment';
      }

      const voucherUrl =
        latestApprovedVoucher?.url ?? latestPendingVoucher?.url ?? null;

      return {
        id: reg.id,
        tournamentName: reg.tournament?.name ?? '',
        categoryName: reg.category?.name ?? '',
        inscriptionAmount,
        insuranceAmount,
        playersCount: activePlayersCount,
        totalAmount,
        paidAmount: regPaidAmount,
        status,
        voucherUrl,
      };
    });

    // Suspensiones — sanciones DISCIPLINARY activas a profiles del roster activo
    // del team. La FE sólo muestra suspensiones de jugadores (no del team).
    const activeRosterIds = await this.prisma.profileTeam.findMany({
      where: { teamId, isActive: true },
      select: { profileId: true },
    });
    const profileIds = activeRosterIds.map((m) => m.profileId);

    const suspensions = profileIds.length
      ? await this.prisma.sanction
          .findMany({
            where: {
              targetType: 'PROFILE',
              kind: 'DISCIPLINARY',
              targetProfileId: { in: profileIds },
            },
            select: {
              id: true,
              targetProfileId: true,
              status: true,
              reason: true,
              notes: true,
              endsAt: true,
              targetProfile: { select: { id: true, name: true } },
            },
          })
          .then((rows) =>
            rows.map((s) => {
              const fechas = readFechasState(s.notes);
              const totalGames = fechas?.totalFechas ?? 0;
              const remainingGames = fechas
                ? Math.max(0, fechas.totalFechas - fechas.fechasCumplidas)
                : 0;
              return {
                profileId: s.targetProfileId ?? '',
                playerName: s.targetProfile?.name ?? '',
                reason: s.reason,
                totalGames,
                remainingGames,
                endDate: s.endsAt ? s.endsAt.toISOString() : '',
                isActive: s.status === 'ACTIVE',
              };
            }),
          )
      : [];

    return {
      totalDebt,
      totalPaid,
      pendingConfirmation,
      registrations,
      suspensions,
    };
  }
}
