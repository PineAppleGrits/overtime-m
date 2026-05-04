import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AdvisoryLockService,
  CronBaseService,
} from '../../../common/cron';
import { AccrueLatePaymentDailyChargeUseCase } from '../../application/use-cases/accrue-late-payment-daily-charge.use-case';

/**
 * Cron RN-029 — corre todos los días a las 03:00 AM (junto al de RN-028;
 * ambos toman locks distintos).
 *
 * Lock: `cron.debts.late-payment-daily-charge`.
 *
 * Idempotente: el use-case chequea `metadata.dayKey` antes de crear cada
 * cargo.
 */
@Injectable()
export class AccrueLatePaymentDailyChargeJob extends CronBaseService {
  protected readonly lockName = 'cron.debts.late-payment-daily-charge';

  constructor(
    advisoryLock: AdvisoryLockService,
    private readonly useCase: AccrueLatePaymentDailyChargeUseCase,
  ) {
    super(advisoryLock);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handle(): Promise<void> {
    await this.runWithLock(async () => {
      const result = await this.useCase.execute();
      this.logger.log(
        `Accrue LATE_PAYMENT_DAILY_CHARGE — scanned=${result.scannedCount} charged=${result.chargedCount} skippedDup=${result.skippedAlreadyChargedCount} errors=${result.errors.length}`,
      );
    });
  }
}
