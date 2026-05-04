import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DebtsService } from '../../../debts/application/services/debts.service';
import { PricingService } from '../../../pricing/application/services/pricing.service';
import {
  DEBT_CONTEXT_PORT,
  IDebtContextPort,
} from '../ports/debt-context.port';
import {
  IRegistrationContextPort,
  REGISTRATION_CONTEXT_PORT,
} from '../ports/registration-context.port';

export interface CreateRegistrationDebtsInput {
  registrationId: string;
  /** Profile que dispara la creación. Sirve como `createdByProfileId` de las debts. */
  createdByProfileId: string;
  /**
   * Override del fee del torneo. Si no se pasa, se calcula vía PricingService.
   * Útil para tests / migraciones.
   */
  entryFeeOverride?: number;
  /** Días de gracia para `dueDate` desde hoy (default 7). */
  dueInDays?: number;
}

export interface CreateRegistrationDebtsResult {
  entryFeeDebtId: string;
  insuranceDebtIds: string[];
  insuranceReusedFor: string[];
}

export interface RegistrationPaymentInsuranceStatus {
  profileId: string;
  paid: boolean;
  reused: boolean;
  debtId?: string;
}

export type RegistrationOfficialStatus =
  | 'PENDING_BOTH'
  | 'PENDING_ENTRY'
  | 'PLAZA_ASEGURADA'
  | 'PENDING_INSURANCES'
  | 'OFICIAL';

export interface RegistrationPaymentStatus {
  registrationId: string;
  entryFeePaid: boolean;
  entryFeeDebtId?: string;
  entryFeeBalance?: number;
  insurances: RegistrationPaymentInsuranceStatus[];
  insurancesPaid: boolean;
  status: RegistrationOfficialStatus;
}

/**
 * Servicio público de PaymentsModule para que `RegistrationsModule` (futuro
 * worktree) lo invoque al aprobar una postulación.
 *
 * Cubre:
 * - RN-013: aprobar postulación crea las debts.
 * - RN-014/RN-015: ambos pagos (inscripción + seguros) deben pagarse.
 * - RN-016: si solo se paga la inscripción → estado PLAZA_ASEGURADA.
 * - RN-017: si el jugador ya tiene seguro vigente, NO se crea INSURANCE
 *   (se reusa el existente).
 *
 * Decisión: el cálculo de `currentYear` y la consulta de "hay INSURANCE PAID
 * vigente" es deliberadamente simple en v1 — chequea
 * `metadata.year === currentYear` en cualquier registration del mismo deporte.
 * Cuando se cierre la decisión sobre validUntil/coverageEndDate, se afina.
 */
@Injectable()
export class RegistrationPaymentsService {
  private readonly logger = new Logger(RegistrationPaymentsService.name);

  constructor(
    private readonly debtsService: DebtsService,
    private readonly pricingService: PricingService,
    @Inject(REGISTRATION_CONTEXT_PORT)
    private readonly registrationCtx: IRegistrationContextPort,
    @Inject(DEBT_CONTEXT_PORT)
    private readonly debtCtx: IDebtContextPort,
  ) {}

  /**
   * Crea las deudas correspondientes a una `Registration` aprobada
   * (RN-013/RN-015/RN-017).
   */
  async createRegistrationDebts(
    input: CreateRegistrationDebtsInput,
  ): Promise<CreateRegistrationDebtsResult> {
    const reg = await this.registrationCtx.getById(input.registrationId);
    if (!reg) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Inscripción no encontrada',
        HttpStatus.NOT_FOUND,
        { registrationId: input.registrationId },
      );
    }

    const dueInDays = input.dueInDays ?? 7;
    const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000);

    // Verificar idempotencia simple: si ya existen debts de tipo
    // REGISTRATION_FEE / INSURANCE para esta registration, no recrear.
    const existing = await this.debtCtx.listByRegistrationId(reg.id);
    const existingEntry = existing.find(
      (d) => d.type === 'REGISTRATION_FEE' && d.status !== 'CANCELLED' && d.status !== 'DELETED_BY_ERROR' && d.status !== 'DELETED_WITH_RECORD',
    );
    const existingInsurances = new Map<string, string>(
      existing
        .filter(
          (d) =>
            d.type === 'INSURANCE' &&
            d.profileId &&
            d.status !== 'CANCELLED' &&
            d.status !== 'DELETED_BY_ERROR' &&
            d.status !== 'DELETED_WITH_RECORD',
        )
        .map((d) => [d.profileId as string, d.id]),
    );

    let entryFeeDebtId: string;

    if (existingEntry) {
      entryFeeDebtId = existingEntry.id;
      this.logger.log(
        `Reutilizando entry fee debt existente para registration ${reg.id}: ${entryFeeDebtId}`,
      );
    } else {
      let entryAmount: number;
      if (input.entryFeeOverride != null) {
        entryAmount = input.entryFeeOverride;
      } else {
        try {
          const fee = await this.pricingService.computeRegistrationFee({
            tournamentId: reg.tournamentId,
            registrationDate: new Date(),
          });
          entryAmount = Number(fee.amount.toString());
        } catch (err) {
          // Si no hay pricing configurado, propagamos. El caller (admin que
          // aprueba la postulación) tiene que asegurar que haya al menos un
          // período de pricing.
          throw err;
        }
      }
      const entryDebt = await this.debtsService.createInternal({
        type: 'REGISTRATION_FEE',
        concept: `Inscripción ${reg.team.name} — ${reg.tournament.name}`,
        originAmount: new Prisma.Decimal(entryAmount),
        dueDate,
        teamId: reg.teamId,
        registrationId: reg.id,
        notes: `Inscripción categoría ${reg.category.name}`,
        metadata: {
          tournamentId: reg.tournamentId,
          categoryId: reg.categoryId,
          year: new Date().getUTCFullYear(),
        },
        createdByProfileId: input.createdByProfileId,
      });
      entryFeeDebtId = entryDebt.id;
    }

    // Insurance per player (RN-015 + RN-017).
    const insurancePerPlayer = reg.tournament.insurancePerPlayer ?? 0;
    const insuranceDebtIds: string[] = [];
    const insuranceReusedFor: string[] = [];
    const currentYear = new Date().getUTCFullYear();

    if (insurancePerPlayer <= 0) {
      this.logger.log(
        `Registration ${reg.id}: insurancePerPlayer no configurado o 0 — no se crean debts INSURANCE`,
      );
    } else {
      for (const playerProfileId of reg.rosterProfileIds) {
        // ¿Ya hay debt INSURANCE para este profile en esta registration?
        const existingInsuranceId = existingInsurances.get(playerProfileId);
        if (existingInsuranceId) {
          insuranceDebtIds.push(existingInsuranceId);
          continue;
        }

        // RN-017 — ¿reusable de otro torneo del mismo año?
        const reusable = await this.debtCtx.hasReusableInsurance({
          profileId: playerProfileId,
          sportId: reg.tournament.sportId,
          year: currentYear,
        });
        if (reusable) {
          insuranceReusedFor.push(playerProfileId);
          this.logger.log(
            `RN-017: insurance reusada para profile ${playerProfileId} (year=${currentYear})`,
          );
          continue;
        }

        const insuranceDebt = await this.debtsService.createInternal({
          type: 'INSURANCE',
          concept: `Seguro de jugador ${playerProfileId}`,
          originAmount: new Prisma.Decimal(insurancePerPlayer),
          dueDate,
          teamId: reg.teamId,
          profileId: playerProfileId,
          registrationId: reg.id,
          metadata: {
            sportId: reg.tournament.sportId,
            tournamentId: reg.tournamentId,
            year: currentYear,
          },
          createdByProfileId: input.createdByProfileId,
        });
        insuranceDebtIds.push(insuranceDebt.id);
      }
    }

    this.logger.log(
      `Registration ${reg.id}: entry debt=${entryFeeDebtId}, insurance debts=${insuranceDebtIds.length}, reused=${insuranceReusedFor.length}`,
    );

    return { entryFeeDebtId, insuranceDebtIds, insuranceReusedFor };
  }

  /**
   * Estado consolidado de pago de una inscripción (RN-015/RN-016).
   * Devuelve flags + agregado.
   */
  async getRegistrationPaymentStatus(
    registrationId: string,
  ): Promise<RegistrationPaymentStatus> {
    const reg = await this.registrationCtx.getById(registrationId);
    if (!reg) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Inscripción no encontrada',
        HttpStatus.NOT_FOUND,
        { registrationId },
      );
    }

    const debts = await this.debtCtx.listByRegistrationId(registrationId);
    const activeOrPaid = (status: string) =>
      status !== 'CANCELLED' &&
      status !== 'DELETED_BY_ERROR' &&
      status !== 'DELETED_WITH_RECORD';

    const entryDebt = debts.find(
      (d) => d.type === 'REGISTRATION_FEE' && activeOrPaid(d.status),
    );

    const insuranceByProfile = new Map<
      string,
      { debt: typeof debts[number]; reused: boolean }
    >();
    for (const d of debts) {
      if (d.type === 'INSURANCE' && activeOrPaid(d.status) && d.profileId) {
        insuranceByProfile.set(d.profileId, { debt: d, reused: false });
      }
    }

    const insurances: RegistrationPaymentInsuranceStatus[] = [];
    for (const profileId of reg.rosterProfileIds) {
      const found = insuranceByProfile.get(profileId);
      if (found) {
        insurances.push({
          profileId,
          paid: found.debt.status === 'PAID',
          reused: false,
          debtId: found.debt.id,
        });
      } else {
        // No hay debt — RN-017 reuso de otro torneo (asumimos cubierto).
        insurances.push({ profileId, paid: true, reused: true });
      }
    }

    const entryFeePaid = !!entryDebt && entryDebt.status === 'PAID';
    const insurancesPaid = insurances.every((i) => i.paid);

    let status: RegistrationOfficialStatus;
    if (!entryDebt) {
      status = 'PENDING_BOTH';
    } else if (!entryFeePaid && !insurancesPaid) {
      status = 'PENDING_BOTH';
    } else if (!entryFeePaid && insurancesPaid) {
      status = 'PENDING_ENTRY';
    } else if (entryFeePaid && !insurancesPaid) {
      status = 'PLAZA_ASEGURADA';
    } else {
      status = 'OFICIAL';
    }

    return {
      registrationId,
      entryFeePaid,
      entryFeeDebtId: entryDebt?.id,
      entryFeeBalance: entryDebt
        ? Number(entryDebt.currentBalance.toString())
        : undefined,
      insurances,
      insurancesPaid,
      status,
    };
  }
}
