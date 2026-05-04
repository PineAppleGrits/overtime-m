import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  AdvisoryLockService,
  CronBaseService,
} from '../../../common/cron';
import { ExpireOverdueFriendliesUseCase } from '../../application/use-cases/expire-overdue-friendlies.use-case';

/**
 * Cron de expiración de amistosos pendientes (RN-023).
 *
 * Corre cada 30 minutos. Idempotente: si los amistosos ya están EXPIRED,
 * el repositorio los excluye (filtra por status IN GENERATED/PENDING_CONFIRMATION).
 *
 * Lock: `cron.friendlies.expire-pending`.
 */
@Injectable()
export class ExpireFriendliesJob extends CronBaseService {
  protected readonly lockName = 'cron.friendlies.expire-pending';

  constructor(
    advisoryLock: AdvisoryLockService,
    private readonly useCase: ExpireOverdueFriendliesUseCase,
  ) {
    super(advisoryLock);
  }

  @Cron('0,30 * * * *')
  async handle(): Promise<void> {
    await this.runWithLock(async () => {
      const result = await this.useCase.execute();
      this.logger.log(
        `Expire friendlies — ${result.expiredCount} marcados como EXPIRED`,
      );
    });
  }
}
