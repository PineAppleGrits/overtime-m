import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  isValidPaymentMethod,
  normalizeMethod,
  shouldAutoDeleteProof,
} from '../../domain/rules/method-validation.rules';
import {
  IProofStoragePort,
  PROOF_STORAGE_PORT,
} from '../../application/ports/proof-storage.port';

const PROOF_RETENTION_DAYS = 3;

/**
 * RN-060 — al aprobarse un pago por transferencia que tiene comprobante,
 * programa el borrado automático del archivo en 3 días.
 *
 * El cron `DeleteScheduledPaymentProofsJob` (W2.1, ya en main) hace el
 * borrado físico cuando llega la fecha.
 */
@Injectable()
export class PaymentApprovedListener {
  private readonly logger = new Logger(PaymentApprovedListener.name);

  constructor(
    @Inject(PROOF_STORAGE_PORT)
    private readonly proofs: IProofStoragePort,
  ) {}

  @OnEvent(DomainEvent.PAYMENT_APPROVED)
  async onPaymentApproved(
    payload: DomainEventPayloads['payment.approved'],
  ): Promise<void> {
    if (!isValidPaymentMethod(payload.method)) return;
    const method = normalizeMethod(payload.method as never);
    if (!shouldAutoDeleteProof(method)) return;

    try {
      const asset = await this.proofs.findLatestForPayment(payload.paymentId);
      if (!asset) {
        this.logger.log(
          `payment.approved: no hay comprobante adjunto para payment ${payload.paymentId} (skip)`,
        );
        return;
      }
      const deleteAt = new Date(
        Date.now() + PROOF_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      );
      await this.proofs.scheduleDeletion(asset.id, deleteAt);
      this.logger.log(
        `RN-060: comprobante ${asset.id} de payment ${payload.paymentId} programado para borrado el ${deleteAt.toISOString()}`,
      );
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `Error programando borrado de comprobante para payment ${payload.paymentId}: ${e.message}`,
        e.stack,
      );
    }
  }
}
