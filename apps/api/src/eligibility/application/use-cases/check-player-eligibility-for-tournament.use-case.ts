import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  EligibilityCheckResult,
  EligibilityReason,
} from '../../domain/entities/eligibility-check-result.entity';
import {
  isMedicalCertValid,
  isSwornStatementValid,
} from '../../domain/rules/medical-cert-validity.rules';
import {
  filterBlockingSanctions,
} from '../../domain/rules/active-suspension.rules';
import {
  checkPlayerTournamentLimits,
} from '../../domain/rules/player-tournament-limits.rules';
import {
  ELIGIBILITY_REPOSITORY,
  IEligibilityRepository,
} from '../ports/eligibility-repository.port';
import {
  ELIGIBILITY_SANCTIONS_PORT,
  IEligibilitySanctionsPort,
} from '../ports/sanctions-port.port';

export interface CheckPlayerEligibilityForTournamentInput {
  profileId: string;
  tournamentId: string;
  /** Equipo y categoría propuestos (cuando se quiere validar al sumar al roster). */
  proposedTeamId?: string;
  proposedCategoryId?: string;
  asOfDate?: Date;
}

/**
 * Consolida checks para inscripción / participación de un jugador en un torneo:
 * - RN-008: apto + DDJJ vigentes (al `asOfDate`).
 * - RN-007: si se pasó `proposedCategoryId`, no puede estar en otro equipo de la misma categoría.
 * - RN-038: máximo 2 equipos por torneo.
 * - RN-003: sin sanción activa de scope torneo.
 * - Blacklist activa.
 */
@Injectable()
export class CheckPlayerEligibilityForTournamentUseCase {
  constructor(
    @Inject(ELIGIBILITY_REPOSITORY)
    private readonly repo: IEligibilityRepository,
    @Inject(ELIGIBILITY_SANCTIONS_PORT)
    private readonly sanctionsPort: IEligibilitySanctionsPort,
  ) {}

  async execute(
    input: CheckPlayerEligibilityForTournamentInput,
  ): Promise<EligibilityCheckResult> {
    const profile = await this.repo.getProfileSnapshot(input.profileId);
    if (!profile) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Perfil ${input.profileId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { profileId: input.profileId },
      );
    }

    const asOfDate = input.asOfDate ?? new Date();
    const reasons: EligibilityReason[] = [];

    if (!isMedicalCertValid(profile.currentMedicalAsset, asOfDate)) {
      reasons.push({
        code: ErrorCode.PROFILE_MEDICAL_CERT_EXPIRED,
        message: 'El apto médico del jugador no está vigente',
        type: 'MEDICAL_CERT',
      });
    }
    if (!isSwornStatementValid(profile.currentSwornAsset, asOfDate)) {
      reasons.push({
        code: ErrorCode.PROFILE_SWORN_STATEMENT_MISSING,
        message: 'La declaración jurada del jugador no está vigente',
        type: 'SWORN_STATEMENT',
      });
    }

    const blacklists = await this.sanctionsPort.findActiveBlacklistsFor({
      profileId: profile.id,
      documentNumber: profile.documentNumber,
    });
    for (const entry of blacklists) {
      reasons.push({
        code: ErrorCode.PROFILE_BLACKLISTED,
        message: `Jugador bloqueado en blacklist: ${entry.reason}`,
        sourceId: entry.id,
        type: 'BLACKLIST',
      });
    }

    const sanctions = await this.sanctionsPort.findActiveSanctionsForProfile(
      profile.id,
    );
    const blocking = filterBlockingSanctions(
      sanctions,
      { tournamentId: input.tournamentId },
      asOfDate,
    );
    for (const sanction of blocking) {
      reasons.push({
        code: ErrorCode.PROFILE_SUSPENDED,
        message: 'El jugador tiene una sanción disciplinaria activa para este torneo',
        sourceId: sanction.id,
        type: 'SANCTION',
      });
    }

    // RN-007 / RN-038
    if (input.proposedTeamId && input.proposedCategoryId) {
      const memberships =
        await this.repo.findActiveRegistrationsForProfileInTournament(
          profile.id,
          input.tournamentId,
        );
      const violation = checkPlayerTournamentLimits(memberships, {
        teamId: input.proposedTeamId,
        categoryId: input.proposedCategoryId,
      });
      if (violation) {
        if (violation.kind === 'CATEGORY_DUPLICATE') {
          reasons.push({
            code: ErrorCode.PLAYER_CATEGORY_DUPLICATE,
            message:
              'El jugador ya está inscripto en otro equipo de la misma categoría (RN-007)',
            sourceId: violation.conflictingTeamId,
            type: 'TOURNAMENT_LIMIT',
          });
        } else {
          reasons.push({
            code: ErrorCode.PLAYER_TOURNAMENT_LIMIT_EXCEEDED,
            message:
              'El jugador ya alcanzó el máximo de 2 equipos en este torneo (RN-038)',
            type: 'TOURNAMENT_LIMIT',
          });
        }
      }
    }

    return EligibilityCheckResult.fromReasons(reasons);
  }
}
