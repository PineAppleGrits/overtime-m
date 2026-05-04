import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AdvisoryLockService,
  CronBaseService,
} from '../../../common/cron';
import { DeleteScheduledPaymentProofsUseCase } from '../../application/use-cases/delete-scheduled-payment-proofs.use-case';

/**
 * Cron RN-060 — borrado automático de comprobantes de transferencia
 * marcados con `scheduledDeletionAt < now`.
 *
 * Schedule: 04:00 AM (después de los crons de cargos para no sobrecargar la
 * misma ventana).
 *
 * Lock: `cron.media.delete-scheduled-payment-proofs`.
 *
 * Nota: la programación del `scheduledDeletionAt` la hace W2.2 (PaymentsService)
 * cuando el admin aprueba un pago de transferencia con comprobante.
 */
@Injectable()
export class DeleteScheduledPaymentProofsJob extends CronBaseService {
  protected readonly lockName = 'cron.media.delete-scheduled-payment-proofs';

  constructor(
    advisoryLock: AdvisoryLockService,
    private readonly useCase: DeleteScheduledPaymentProofsUseCase,
  ) {
    super(advisoryLock);
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handle(): Promise<void> {
    await this.runWithLock(async () => {
      const result = await this.useCase.execute();
      this.logger.log(
        `Delete scheduled payment proofs — scanned=${result.scannedCount} deleted=${result.deletedCount} errors=${result.errors.length}`,
      );
    });
  }
}
