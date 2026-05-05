import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { PrismaService } from '../../../database/prisma.service';
import { CheckPlayerEligibilityForMatchUseCase } from '../use-cases/check-player-eligibility-for-match.use-case';
import { CheckPlayerEligibilityForTournamentUseCase } from '../use-cases/check-player-eligibility-for-tournament.use-case';
import { CheckTeamEligibilityForMatchUseCase } from '../use-cases/check-team-eligibility-for-match.use-case';
import { EligibilityCheckResult } from '../../domain/entities/eligibility-check-result.entity';
import {
  ELIGIBILITY_SANCTIONS_PORT,
  IEligibilitySanctionsPort,
} from '../ports/sanctions-port.port';
import { filterBlockingSanctions } from '../../domain/rules/active-suspension.rules';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

interface ScopeInput {
  tournamentId?: string;
  categoryId?: string;
  matchId?: string;
}

/**
 * Facade del módulo Eligibility (W3.3).
 *
 * Expone:
 * - 3 checks consolidados (player-match, player-tournament, team-match) basados
 *   en use-cases.
 * - **Compatibilidad** con consumers anteriores (matches, registrations, teams):
 *   `assertProfileNotBlacklisted`, `assertProfileEligibleForRegistration`,
 *   `assertTeamEligibleForRegistration`, `assertTeamEligibleForMatch`,
 *   `getProfileEligibility`, `getTeamEligibility`. Esos métodos siguen el
 *   contrato preexistente para no romper a quienes ya los usan.
 *
 * La lectura de sanciones y blacklists pasa por el `IEligibilitySanctionsPort`,
 * que internamente delega al módulo Sanctions (W3.3 separation).
 */
@Injectable()
export class EligibilityService {
  constructor(
    private readonly checkPlayerForMatch: CheckPlayerEligibilityForMatchUseCase,
    private readonly checkPlayerForTournament: CheckPlayerEligibilityForTournamentUseCase,
    private readonly checkTeamForMatch: CheckTeamEligibilityForMatchUseCase,
    @Inject(ELIGIBILITY_SANCTIONS_PORT)
    private readonly sanctionsPort: IEligibilitySanctionsPort,
    private readonly prisma: PrismaService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────
  //  Nuevos checks consolidados (W3.3)
  // ───────────────────────────────────────────────────────────────────────

  async getPlayerMatchEligibility(input: {
    profileId: string;
    matchId: string;
    teamId?: string;
  }): Promise<EligibilityCheckResult> {
    return this.checkPlayerForMatch.execute(input);
  }

  async getPlayerTournamentEligibility(input: {
    profileId: string;
    tournamentId: string;
    proposedTeamId?: string;
    proposedCategoryId?: string;
  }): Promise<EligibilityCheckResult> {
    return this.checkPlayerForTournament.execute(input);
  }

  async getTeamMatchEligibility(input: {
    teamId: string;
    matchId: string;
    allowFiftyPercentRule?: boolean;
  }): Promise<EligibilityCheckResult> {
    return this.checkTeamForMatch.execute(input);
  }

  // ───────────────────────────────────────────────────────────────────────
  //  Compatibilidad con consumers preexistentes
  //  (matches.service / registrations.service / teams.service)
  // ───────────────────────────────────────────────────────────────────────

  async assertProfileNotBlacklisted(
    profileId: string,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<void> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId, deletedAt: null },
      select: { id: true, documentNumber: true },
    });
    if (!profile) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Perfil no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const blacklists = await this.sanctionsPort.findActiveBlacklistsFor({
      profileId: profile.id,
      documentNumber: profile.documentNumber,
    });
    if (blacklists.length > 0) {
      throw new BusinessError(
        ErrorCode.PROFILE_BLACKLISTED,
        `El jugador no es elegible: ${blacklists.map((b) => b.reason).join('; ')}`,
        HttpStatus.CONFLICT,
        { profileId, blacklistIds: blacklists.map((b) => b.id) },
      );
    }
  }

  async assertProfileEligibleForRegistration(
    params: {
      profileId: string;
      tournamentId?: string;
      categoryId?: string;
      matchId?: string;
    },
    prisma: PrismaClientLike = this.prisma,
  ): Promise<void> {
    const profile = await prisma.profile.findUnique({
      where: { id: params.profileId, deletedAt: null },
      select: { id: true, documentNumber: true },
    });
    if (!profile) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Perfil no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const scope = await this.normalizeScope(params, prisma);

    const [blacklists, sanctions] = await Promise.all([
      this.sanctionsPort.findActiveBlacklistsFor({
        profileId: profile.id,
        documentNumber: profile.documentNumber,
      }),
      this.sanctionsPort.findActiveSanctionsForProfile(profile.id),
    ]);

    if (blacklists.length > 0) {
      throw new BusinessError(
        ErrorCode.PROFILE_BLACKLISTED,
        `El jugador está en blacklist: ${blacklists.map((b) => b.reason).join('; ')}`,
        HttpStatus.CONFLICT,
        { profileId: profile.id },
      );
    }

    const blocking = filterBlockingSanctions(sanctions, scope, new Date());
    if (blocking.length > 0) {
      throw new BusinessError(
        ErrorCode.PROFILE_SUSPENDED,
        'El jugador tiene sanciones activas que bloquean la inscripción',
        HttpStatus.CONFLICT,
        { profileId: profile.id, sanctionIds: blocking.map((s) => s.id) },
      );
    }
  }

  async assertTeamEligibleForRegistration(
    params: {
      teamId: string;
      tournamentId?: string;
      categoryId?: string;
    },
    prisma: PrismaClientLike = this.prisma,
  ): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: params.teamId, deletedAt: null },
      select: { id: true },
    });
    if (!team) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Equipo no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const scope = await this.normalizeScope(params, prisma);
    const sanctions = await this.sanctionsPort.findActiveSanctionsForTeam(
      params.teamId,
    );
    const blocking = filterBlockingSanctions(sanctions, scope, new Date());
    if (blocking.length > 0) {
      throw new BusinessError(
        ErrorCode.PROFILE_SUSPENDED,
        'El equipo tiene sanciones activas que bloquean la inscripción',
        HttpStatus.CONFLICT,
        { teamId: params.teamId, sanctionIds: blocking.map((s) => s.id) },
      );
    }
  }

  async assertTeamEligibleForMatch(
    params: {
      teamId: string;
      tournamentId?: string;
      categoryId?: string;
      matchId?: string;
    },
    prisma: PrismaClientLike = this.prisma,
  ): Promise<void> {
    return this.assertTeamEligibleForRegistration(
      { teamId: params.teamId, tournamentId: params.tournamentId, categoryId: params.categoryId },
      prisma,
    );
  }

  /**
   * Versión legacy `{ eligible, blockers[] }`. Mantenida para compat con FE/admin.
   * Para nuevas integraciones preferir `getPlayerMatchEligibility`/etc.
   */
  async getProfileEligibility(
    profileId: string,
    scope: ScopeInput = {},
  ): Promise<{
    eligible: boolean;
    blockers: Array<{ type: string; reason: string; sourceId: string }>;
  }> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId, deletedAt: null },
      select: { id: true, documentNumber: true },
    });
    if (!profile) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Perfil no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const normalized = await this.normalizeScope(scope, this.prisma);
    const [blacklists, sanctions] = await Promise.all([
      this.sanctionsPort.findActiveBlacklistsFor({
        profileId: profile.id,
        documentNumber: profile.documentNumber,
      }),
      this.sanctionsPort.findActiveSanctionsForProfile(profile.id),
    ]);
    const blocking = filterBlockingSanctions(sanctions, normalized, new Date());
    const blockers = [
      ...blacklists.map((b) => ({
        type: 'BLACKLIST',
        reason: b.reason,
        sourceId: b.id,
      })),
      ...blocking.map((s) => ({
        type: `SANCTION_${s.kind}`,
        reason: 'Sanción activa',
        sourceId: s.id,
      })),
    ];
    return { eligible: blockers.length === 0, blockers };
  }

  async getTeamEligibility(
    teamId: string,
    scope: ScopeInput = {},
  ): Promise<{
    eligible: boolean;
    blockers: Array<{ type: string; reason: string; sourceId: string }>;
  }> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true },
    });
    if (!team) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Equipo no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const normalized = await this.normalizeScope(scope, this.prisma);
    const sanctions = await this.sanctionsPort.findActiveSanctionsForTeam(teamId);
    const blocking = filterBlockingSanctions(sanctions, normalized, new Date());
    const blockers = blocking.map((s) => ({
      type: `SANCTION_${s.kind}`,
      reason: 'Sanción activa',
      sourceId: s.id,
    }));
    return { eligible: blockers.length === 0, blockers };
  }

  // ───────────────────────────────────────────────────────────────────────

  private async normalizeScope(
    scope: ScopeInput,
    prisma: PrismaClientLike,
  ): Promise<{ tournamentId?: string; categoryId?: string; matchId?: string }> {
    let tournamentId = scope.tournamentId;
    let categoryId = scope.categoryId;
    const matchId = scope.matchId;

    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId, deletedAt: null },
        select: {
          id: true,
          categoryId: true,
          category: { select: { tournamentId: true } },
        },
      });
      if (match) {
        categoryId ??= match.categoryId ?? undefined;
        tournamentId ??= match.category?.tournamentId;
      }
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, deletedAt: null },
        select: { id: true, tournamentId: true },
      });
      if (category) {
        if (tournamentId && tournamentId !== category.tournamentId) {
          throw new BusinessError(
            ErrorCode.VALIDATION_FAILED,
            'La categoría no pertenece al torneo indicado',
            HttpStatus.BAD_REQUEST,
          );
        }
        tournamentId = category.tournamentId;
      }
    }

    return { tournamentId, categoryId, matchId };
  }
}
