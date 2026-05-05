import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  EligibilityCheckResult,
  EligibilityReason,
} from '../../domain/entities/eligibility-check-result.entity';
import { isMedicalCertValid, isSwornStatementValid } from '../../domain/rules/medical-cert-validity.rules';
import { filterBlockingSanctions } from '../../domain/rules/active-suspension.rules';
import {
  ELIGIBILITY_REPOSITORY,
  IEligibilityRepository,
} from '../ports/eligibility-repository.port';
import {
  ELIGIBILITY_SANCTIONS_PORT,
  IEligibilitySanctionsPort,
} from '../ports/sanctions-port.port';
import {
  DEBTS_ELIGIBILITY_PORT,
  IDebtsEligibilityPort,
} from '../ports/debts-port.port';

export interface CheckPlayerEligibilityForMatchInput {
  profileId: string;
  matchId: string;
  /** Equipo del jugador en ese partido — opcional, si se conoce, se valida deuda RN-053. */
  teamId?: string;
  /** Fecha de evaluación (default: now). */
  asOfDate?: Date;
}

/**
 * Consolida los checks de un jugador para un partido específico:
 * - RN-008: apto médico vigente.
 * - RN-008: declaración jurada vigente (si aplica).
 * - RN-003: sin sanción disciplinaria activa en scope.
 * - Blacklist activa (por profileId o documentNumber).
 * - RN-053: si conocemos el `teamId`, el equipo no tiene deudas vencidas.
 */
@Injectable()
export class CheckPlayerEligibilityForMatchUseCase {
  constructor(
    @Inject(ELIGIBILITY_REPOSITORY)
    private readonly repo: IEligibilityRepository,
    @Inject(ELIGIBILITY_SANCTIONS_PORT)
    private readonly sanctionsPort: IEligibilitySanctionsPort,
    @Inject(DEBTS_ELIGIBILITY_PORT)
    private readonly debtsPort: IDebtsEligibilityPort,
  ) {}

  async execute(
    input: CheckPlayerEligibilityForMatchInput,
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

    const matchScope = await this.repo.getMatchScope(input.matchId);
    if (!matchScope) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Partido ${input.matchId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { matchId: input.matchId },
      );
    }

    const asOfDate = input.asOfDate ?? new Date();
    const reasons: EligibilityReason[] = [];

    // RN-008 — apto médico
    if (!isMedicalCertValid(profile.currentMedicalAsset, asOfDate)) {
      reasons.push({
        code: ErrorCode.PROFILE_MEDICAL_CERT_EXPIRED,
        message: 'El apto médico del jugador no está vigente',
        type: 'MEDICAL_CERT',
      });
    }

    // RN-008 — DDJJ
    if (!isSwornStatementValid(profile.currentSwornAsset, asOfDate)) {
      reasons.push({
        code: ErrorCode.PROFILE_SWORN_STATEMENT_MISSING,
        message: 'La declaración jurada del jugador no está vigente',
        type: 'SWORN_STATEMENT',
      });
    }

    // Blacklist
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

    // RN-003 — Sanciones activas (scope: este partido / categoría / torneo)
    const sanctions = await this.sanctionsPort.findActiveSanctionsForProfile(
      profile.id,
    );
    const blocking = filterBlockingSanctions(
      sanctions,
      {
        matchId: input.matchId,
        categoryId: matchScope.categoryId ?? undefined,
        tournamentId: matchScope.tournamentId ?? undefined,
      },
      asOfDate,
    );
    for (const sanction of blocking) {
      reasons.push({
        code: ErrorCode.PROFILE_SUSPENDED,
        message: 'El jugador tiene una sanción disciplinaria activa',
        sourceId: sanction.id,
        type: 'SANCTION',
      });
    }

    // RN-053 — deuda del equipo (solo si se conoce)
    if (input.teamId) {
      const hasDebts = await this.debtsPort.hasOutstandingDebts(input.teamId);
      if (hasDebts) {
        reasons.push({
          code: ErrorCode.MATCH_TEAM_HAS_OUTSTANDING_DEBT,
          message:
            'El equipo del jugador tiene deudas pendientes que bloquean el partido',
          sourceId: input.teamId,
          type: 'DEBT',
        });
      }
    }

    return EligibilityCheckResult.fromReasons(reasons);
  }
}
