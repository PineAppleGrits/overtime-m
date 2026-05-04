import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AdvisoryLockService,
  CronBaseService,
} from '../../../common/cron';
import { AccrueOverdueInterestUseCase } from '../../application/use-cases/accrue-overdue-interest.use-case';

/**
 * Cron RN-028 — corre todos los días a las 03:00 AM.
 *
 * Lock: `cron.debts.accrue-overdue-interest`.
 *
 * Idempotente: el use-case chequea `metadata.dayKey` antes de crear cada
 * cargo, por lo que si el job corre dos veces el mismo día no duplica.
 */
@Injectable()
export class AccrueOverdueInterestJob extends CronBaseService {
  protected readonly lockName = 'cron.debts.accrue-overdue-interest';

  constructor(
    advisoryLock: AdvisoryLockService,
    private readonly useCase: AccrueOverdueInterestUseCase,
  ) {
    super(advisoryLock);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handle(): Promise<void> {
    await this.runWithLock(async () => {
      const result = await this.useCase.execute();
      this.logger.log(
        `Accrue OVERDUE_INTEREST — scanned=${result.scannedCount} charged=${result.chargedCount} skippedDup=${result.skippedAlreadyChargedCount} errors=${result.errors.length}`,
      );
    });
  }
}
