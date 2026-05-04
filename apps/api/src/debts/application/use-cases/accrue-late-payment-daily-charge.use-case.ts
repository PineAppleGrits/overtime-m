import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
  debtTypeAccruesLatePaymentCharge,
  startOfUtcDay,
  toDayKey,
} from '../../domain/rules/interest-calc.rules';
import { CreateDebtInternalUseCase } from './create-debt-internal.use-case';

export interface AccrueLatePaymentInput {
  now?: Date;
  systemProfileId?: string;
  take?: number;
}

export interface AccrueLatePaymentOutput {
  scannedCount: number;
  chargedCount: number;
  skippedAlreadyChargedCount: number;
  errors: Array<{ debtId: string; error: string }>;
}

/**
 * Cron RN-029 — Cargo diario por pago fuera de fecha sobre deudas de tipo
 * `REGISTRATION_FEE` o `INSURANCE` cuya `dueDate` ya pasó.
 *
 * Mismo patrón de idempotencia que `AccrueOverdueInterestUseCase`:
 * `metadata.dayKey = YYYY-MM-DD`. La hija tiene type `LATE_PAYMENT_DAILY_CHARGE`.
 *
 * Aplica el monto del torneo si está disponible, sino default $5.000.
 */
@Injectable()
export class AccrueLatePaymentDailyChargeUseCase {
  private readonly logger = new Logger(
    AccrueLatePaymentDailyChargeUseCase.name,
  );

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
    @Inject(DEBT_CONTEXT)
    private readonly context: IDebtContext,
    private readonly createDebt: CreateDebtInternalUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: AccrueLatePaymentInput = {},
  ): Promise<AccrueLatePaymentOutput> {
    const now = input.now ?? new Date();
    const startOfToday = startOfUtcDay(now);
    const systemProfileId = input.systemProfileId ?? 'system';
    const take = input.take ?? 500;

    const candidates = await this.repo.findOverdue({
      beforeDate: startOfToday,
      types: ['REGISTRATION_FEE', 'INSURANCE'],
      take,
    });

    let chargedCount = 0;
    let skippedAlreadyChargedCount = 0;
    const errors: Array<{ debtId: string; error: string }> = [];

    for (const debt of candidates) {
      try {
        if (!debtTypeAccruesLatePaymentCharge(debt.type)) {
          continue;
        }

        const dayKey = toDayKey(now);
        const alreadyCharged = await this.repo.hasChildDebtForDay({
          parentDebtId: debt.id,
          type: 'LATE_PAYMENT_DAILY_CHARGE',
          dayKey,
        });
        if (alreadyCharged) {
          skippedAlreadyChargedCount += 1;
          continue;
        }

        await this.createCharge({
          parentDebt: debt,
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
          `Error generando LATE_PAYMENT_DAILY_CHARGE para debt ${debt.id}: ${error.message}`,
          error.stack,
        );
        errors.push({ debtId: debt.id, error: error.message });
      }
    }

    this.logger.log(
      `Accrue late payment daily charge — scanned=${candidates.length}, charged=${chargedCount}, skippedDup=${skippedAlreadyChargedCount}, errors=${errors.length}`,
    );

    return {
      scannedCount: candidates.length,
      chargedCount,
      skippedAlreadyChargedCount,
      errors,
    };
  }

  private async createCharge(params: {
    parentDebt: DebtWithRelations;
    dayKey: string;
    now: Date;
    systemProfileId: string;
  }): Promise<void> {
    const descriptor = buildInterestChargeDescriptor({
      parentDebtId: params.parentDebt.id,
      parentConcept: params.parentDebt.concept,
      date: params.now,
      chargeType: 'LATE_PAYMENT_DAILY_CHARGE',
    });

    const amountFromContext = await this.context.resolveOverdueDailyAmountForDebt(
      params.parentDebt.id,
    );
    // TODO: RN-021 / DP — fee global configurable. Default referencial $5.000.
    const amount = amountFromContext ?? DEFAULT_OVERDUE_DAILY_AMOUNT;

    await this.createDebt.execute({
      type: 'LATE_PAYMENT_DAILY_CHARGE',
      concept: descriptor.concept,
      originAmount: amount,
      dueDate: params.now,
      currency: params.parentDebt.currency,
      teamId: params.parentDebt.teamId,
      profileId: params.parentDebt.profileId,
      parentDebtId: params.parentDebt.id,
      metadata: { dayKey: params.dayKey, parentDebtId: params.parentDebt.id },
      createdByProfileId: params.systemProfileId,
      registrationId: params.parentDebt.registrationId,
      matchId: params.parentDebt.matchId,
      friendlyId: params.parentDebt.friendlyId,
      sanctionId: params.parentDebt.sanctionId,
    });
  }
}
