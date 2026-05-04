import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DebtType, Prisma } from '@prisma/client';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  DEBT_REPOSITORY,
  DebtWithRelations,
  IDebtRepository,
} from '../ports/debt-repository.port';
import {
  DEBT_CONTEXT,
  IDebtContext,
} from '../ports/debt-context.port';
import {
  DEFAULT_OVERDUE_DAILY_AMOUNT,
  buildInterestChargeDescriptor,
  debtTypeAccruesOverdueInterest,
  startOfUtcDay,
  toDayKey,
} from '../../domain/rules/interest-calc.rules';
import { CreateDebtInternalUseCase } from './create-debt-internal.use-case';

export interface AccrueOverdueInterestInput {
  /** Override para tests; default `new Date()`. */
  now?: Date;
  /** Profile id que figura como createdBy de los cargos generados (ej: "system"). */
  systemProfileId?: string;
  /** Cap de seguridad por corrida; default 500. */
  take?: number;
}

export interface AccrueOverdueInterestOutput {
  scannedCount: number;
  chargedCount: number;
  skippedAlreadyChargedCount: number;
  errors: Array<{ debtId: string; error: string }>;
}

/**
 * Cron RN-028 — Por cada deuda vencida con saldo, emite un cargo diario de
 * tipo `OVERDUE_INTEREST`.
 *
 * Idempotencia: cada cargo guarda `metadata.dayKey = YYYY-MM-DD`. Antes de
 * crear, el use-case chequea si ya existe una hija con ese dayKey; si sí,
 * skippea.
 *
 * El monto se lee del torneo asociado a la deuda si es resoluble; si no,
 * usa el default $5.000 (RN-028 referencial).
 *
 * Excluye REGISTRATION_FEE/INSURANCE — esos van por LATE_PAYMENT_DAILY_CHARGE
 * (RN-029).
 */
@Injectable()
export class AccrueOverdueInterestUseCase {
  private readonly logger = new Logger(AccrueOverdueInterestUseCase.name);

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
    @Inject(DEBT_CONTEXT)
    private readonly context: IDebtContext,
    private readonly createDebt: CreateDebtInternalUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: AccrueOverdueInterestInput = {},
  ): Promise<AccrueOverdueInterestOutput> {
    const now = input.now ?? new Date();
    const startOfToday = startOfUtcDay(now);
    const systemProfileId = input.systemProfileId ?? 'system';
    const take = input.take ?? 500;

    const candidates = await this.repo.findOverdue({
      beforeDate: startOfToday,
      excludeTypes: [
        'REGISTRATION_FEE',
        'INSURANCE',
        'OVERDUE_INTEREST',
        'LATE_PAYMENT_DAILY_CHARGE',
      ],
      take,
    });

    let chargedCount = 0;
    let skippedAlreadyChargedCount = 0;
    const errors: Array<{ debtId: string; error: string }> = [];

    for (const debt of candidates) {
      try {
        if (!debtTypeAccruesOverdueInterest(debt.type)) {
          continue;
        }

        const dayKey = toDayKey(now);
        const alreadyCharged = await this.repo.hasChildDebtForDay({
          parentDebtId: debt.id,
          type: 'OVERDUE_INTEREST',
          dayKey,
        });
        if (alreadyCharged) {
          skippedAlreadyChargedCount += 1;
          continue;
        }

        await this.createSingleCharge({
          parentDebt: debt,
          chargeType: 'OVERDUE_INTEREST',
          dayKey,
          now,
          systemProfileId,
        });

        const overduePayload: DomainEventPayloads['debt.overdue.detected'] = {
          debtId: debt.id,
        };
        this.eventEmitter.emit(
          DomainEvent.DEBT_OVERDUE_DETECTED,
          overduePayload,
        );

        chargedCount += 1;
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Error generando OVERDUE_INTEREST para debt ${debt.id}: ${error.message}`,
          error.stack,
        );
        errors.push({ debtId: debt.id, error: error.message });
      }
    }

    this.logger.log(
      `Accrue overdue interest — scanned=${candidates.length}, charged=${chargedCount}, skippedDup=${skippedAlreadyChargedCount}, errors=${errors.length}`,
    );

    return {
      scannedCount: candidates.length,
      chargedCount,
      skippedAlreadyChargedCount,
      errors,
    };
  }

  private async createSingleCharge(params: {
    parentDebt: DebtWithRelations;
    chargeType: DebtType;
    dayKey: string;
    now: Date;
    systemProfileId: string;
  }): Promise<void> {
    const descriptor = buildInterestChargeDescriptor({
      parentDebtId: params.parentDebt.id,
      parentConcept: params.parentDebt.concept,
      date: params.now,
      chargeType: params.chargeType as
        | 'OVERDUE_INTEREST'
        | 'LATE_PAYMENT_DAILY_CHARGE',
    });

    const amountFromContext = await this.context.resolveOverdueDailyAmountForDebt(
      params.parentDebt.id,
    );
    // TODO: RN-021 / DP — fee global configurable. Default referencial $5.000.
    const amount = amountFromContext ?? DEFAULT_OVERDUE_DAILY_AMOUNT;

    await this.createDebt.execute({
      type: descriptor.type,
      concept: descriptor.concept,
      originAmount: amount,
      dueDate: params.now,
      currency: params.parentDebt.currency,
      teamId: params.parentDebt.teamId,
      profileId: params.parentDebt.profileId,
      parentDebtId: params.parentDebt.id,
      metadata: { dayKey: params.dayKey, parentDebtId: params.parentDebt.id },
      createdByProfileId: params.systemProfileId,
      // Hereda el contexto de origen para trazabilidad
      registrationId: params.parentDebt.registrationId,
      matchId: params.parentDebt.matchId,
      friendlyId: params.parentDebt.friendlyId,
      sanctionId: params.parentDebt.sanctionId,
    });
  }
}

// Re-export for testing convenience
export { Prisma };
