import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  DebtStatus,
  DebtType,
  MediaCategory,
  MediaVisibility,
} from '@prisma/client';
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
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  Modality,
  SportCode,
} from '../../../common/sport-rules/sport-rules.types';
import {
  TEAM_ELIGIBILITY_PORT,
  type TeamEligibilityPort,
} from '../ports/team-eligibility.port';
import { TEAM_MEDIA_PORT, type TeamMediaPort } from '../ports/team-media.port';
import {
  TEAM_REPOSITORY,
  type TeamMatchPreviewSource,
  type TeamRepository,
} from '../ports/team-repository.port';
import {
  TEAM_SPORT_RULES_PORT,
  type TeamSportRulesPort,
} from '../ports/team-sport-rules.port';
import {
  TEAM_TOURNAMENT_CONTEXT_PORT,
  type TeamTournamentContextPort,
} from '../ports/team-tournament-context.port';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @Inject(TEAM_REPOSITORY)
    private readonly repository: TeamRepository,
    @Inject(TEAM_TOURNAMENT_CONTEXT_PORT)
    private readonly tournamentContext: TeamTournamentContextPort,
    @Inject(TEAM_ELIGIBILITY_PORT)
    private readonly eligibility: TeamEligibilityPort,
    @Inject(TEAM_MEDIA_PORT)
    private readonly media: TeamMediaPort,
    @Inject(TEAM_SPORT_RULES_PORT)
    private readonly sportRules: TeamSportRulesPort,
  ) {}

  private async generateTeamSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        return this.repository.isTeamSlugTaken(slug, excludeId);
      },
    });
  }

  private async generateFranchiseSlug(name: string): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        return this.repository.isFranchiseSlugTaken(slug);
      },
    });
  }

  private async getTournamentForTeamOperations(tournamentId: string) {
    const tournament =
      await this.tournamentContext.findTournamentForOperations(tournamentId);

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
    const creator = await this.repository.findCreatorProfileById(creatorId);
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
    const sport = await this.repository.findSportById(createTeamDto.sportId);

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    if (createTeamDto.captainId) {
      const captain = await this.repository.findCaptainProfileById(
        createTeamDto.captainId,
      );
      if (!captain) {
        throw new NotFoundException('Captain not found');
      }
    }

    const team = await this.repository.createTeam({
      ...createTeamDto,
      slug: await this.generateTeamSlug(createTeamDto.name),
      creatorId,
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
    const profile = await this.repository.findProfileDocumentNumber(profileId);
    return this.repository.listMyTeams(profileId, profile?.documentNumber ?? null);
  }

  async findAll(paginationDto: PaginationSchemaDto) {
    return this.repository.listTeams(paginationDto);
  }

  async findOne(id: string) {
    const team = await this.repository.findTeamDetailById(id);

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamSchemaDto) {
    await this.findOne(id);

    // Si se está actualizando el deporte, verificar que existe
    if (updateTeamDto.sportId) {
      const sport = await this.repository.findSportById(updateTeamDto.sportId);

      if (!sport) {
        throw new NotFoundException('Sport not found');
      }
    }

    if (updateTeamDto.captainId) {
      const captain = await this.repository.findCaptainProfileById(
        updateTeamDto.captainId,
      );
      if (!captain) {
        throw new NotFoundException('Captain not found');
      }
      const member = await this.repository.findMembership(
        id,
        updateTeamDto.captainId,
        true,
      );
      if (!member) {
        throw new BadRequestException('Captain must be a member of the team');
      }
    }

    const team = await this.repository.updateTeam(id, {
      ...updateTeamDto,
      slug: updateTeamDto.name
        ? await this.generateTeamSlug(updateTeamDto.name, id)
        : undefined,
    });

    this.logger.log(`Team updated: ${team.name}`);

    return team;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.repository.softDeleteTeam(id);

    this.logger.log(`Team deleted: ${id}`);

    return { message: 'Team deleted successfully' };
  }

  async addPlayer(teamId: string, addPlayerDto: AddPlayerSchemaDto) {
    const team = await this.findOne(teamId);

    const profile = await this.repository.findProfileById(addPlayerDto.profileId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.eligibility.assertProfileNotBlacklisted(profile.id);

    const existingMembership = await this.repository.findMembership(
      teamId,
      addPlayerDto.profileId,
    );

    if (existingMembership) {
      if (!existingMembership.isActive) {
        await this.repository.reactivateMembership(existingMembership.id);
        return this.findOne(teamId);
      }
      throw new ConflictException('Profile already in team');
    }

    // RN-002 — un jugador no puede pertenecer activamente a otro equipo del mismo deporte.
    const conflictingMembership = await this.repository.findConflictingMembership({
      teamId,
      profileId: addPlayerDto.profileId,
      sportId: team.sportId as string,
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

    await this.repository.createMembership(teamId, addPlayerDto.profileId);

    this.logger.log(`Profile ${profile.name} added to team ${team.name}`);

    return this.findOne(teamId);
  }

  async removePlayer(teamId: string, profileId: string) {
    await this.findOne(teamId);

    const membership = await this.repository.findMembership(teamId, profileId, true);

    if (!membership) {
      throw new NotFoundException('Profile not in team');
    }

    await this.repository.deactivateMembership(membership.id);

    this.logger.log(`Profile ${profileId} removed from team ${teamId}`);

    return this.findOne(teamId);
  }

  async assignCaptain(teamId: string, profileId: string) {
    const team = await this.findOne(teamId);

    const member = await this.repository.findMembership(teamId, profileId, true);

    if (!member) {
      throw new BadRequestException('Captain must be a member of the team');
    }

    const updatedTeam = await this.repository.assignCaptain(teamId, profileId);

    this.logger.log(`Captain assigned to team ${team.name}`);

    return updatedTeam;
  }

  async promoteToFranchise(
    teamId: string,
    dto: CreateFranchiseSchemaDto,
    ownerId: string,
  ) {
    const team = await this.repository.findPromotionCandidate(teamId);

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

    const promotedTeam = await this.repository.promoteToFranchise({
      teamId,
      name: dto.name,
      slug: await this.generateFranchiseSlug(dto.name),
      logoUrl: dto.logoUrl,
      ownerId,
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
    const team = await this.repository.findSportCodeByTeamId(teamId);
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const sportCode = team.sport.code as SportCode;
    const rules = this.sportRules.getRosterBounds(sportCode, modality);
    if (!rules) {
      throw new BusinessError(
        ErrorCode.SPORT_RULES_NOT_FOUND,
        `No hay reglas para sport="${sportCode}" modality="${modality}"`,
        HttpStatus.BAD_REQUEST,
        { sportCode, modality },
      );
    }

    const count = await this.repository.countActiveTeamMembers(teamId);

    const { rosterMin, rosterMax } = rules;
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
    const team = await this.repository.findLogoByTeamId(teamId);
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

    const asset = await this.media.upload({
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

    await this.repository.updateTeamLogoAsset(teamId, asset.id);

    if (previousAssetId && previousAssetId !== asset.id) {
      try {
        await this.media.delete(previousAssetId);
      } catch (err) {
        this.logger.warn(
          `Failed to delete previous logo asset ${previousAssetId} for team ${teamId}`,
        );
      }
    }

    const url = await this.media.getAccessUrl(asset);

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
    const team = await this.repository.findTeamExists(teamId);
    if (!team) throw new NotFoundException('Team not found');

    const wantsLast = !type || type === 'last';
    const wantsNext = !type || type === 'next';

    const [last, next] = await Promise.all([
      wantsLast ? this.repository.findLastMatchPreview(teamId) : Promise.resolve(null),
      wantsNext ? this.repository.findNextMatchPreview(teamId) : Promise.resolve(null),
    ]);

    return {
      lastMatch: last ? this.toMatchPreview(last) : null,
      nextMatch: next ? this.toMatchPreview(next) : null,
    };
  }

  private toMatchPreview(match: TeamMatchPreviewSource) {
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
    const team = await this.repository.findBalanceAccess(teamId);
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
    const debts = await this.repository.findDebtsByTeamId(teamId);

    // Acumuladores globales.
    const decimalToNumber = (d: { toString(): string }): number =>
      Number(d.toString());

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

    const registrationRecords =
      await this.repository.findRegistrationSummariesByTeamId(teamId);

    // playersCount es un proxy del roster actual del team (no hay snapshot por
    // registration en el schema). TODO: si en el futuro RegistrationRosterEntry
    // se materializa por inscripción, derivar de ahí en lugar del roster activo.
    const activePlayersCount = await this.repository.countActiveTeamMembers(teamId);

    // Para resolver voucherUrl tomamos el último Payment con un MediaAsset
    // category=PAYMENT_PROOF asociado vía metadata.paymentId. Buscamos los
    // assets en una sola query y los mapeamos por paymentId.
    const allPaymentIds = debts.flatMap((d) => d.payments.map((p) => p.id));
    const proofAssets = await this.repository.findPaymentProofAssets(allPaymentIds);
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
    const profileIds = await this.repository.findActiveRosterProfileIds(teamId);

    const suspensions = (
      await this.repository.findActiveProfileSanctions(profileIds)
    ).map((s) => {
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
    });

    return {
      totalDebt,
      totalPaid,
      pendingConfirmation,
      registrations,
      suspensions,
    };
  }
}
