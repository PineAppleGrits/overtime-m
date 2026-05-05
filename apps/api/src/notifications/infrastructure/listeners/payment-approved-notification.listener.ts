import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { paymentApprovedTemplate } from '../../domain/templates';

/**
 * Notificación de pago aprobado al usuario que pagó.
 *
 * Nota: este listener es independiente del `PaymentApprovedListener` del
 * módulo Payments (ese maneja RN-060 = borrado de comprobantes).
 */
@Injectable()
export class PaymentApprovedNotificationListener {
  private readonly logger = new Logger(
    PaymentApprovedNotificationListener.name,
  );

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.PAYMENT_APPROVED)
  async handle(
    payload: DomainEventPayloads['payment.approved'],
  ): Promise<void> {
    try {
      const payment = await this.context.findPayment(payload.paymentId);
      if (!payment) return;
      if (!payment.paidByProfile?.email) return;
      const rendered = paymentApprovedTemplate({
        recipientName: payment.paidByProfile.name,
        amount: payment.amount,
        currency: payment.currency,
        concept: payment.conceptLabel,
        paymentId: payment.id,
      });
      await this.notifications.send({
        to: payment.paidByProfile.email,
        rendered,
        tags: [
          { name: 'type', value: 'payment_approved' },
          { name: 'payment_id', value: payment.id },
        ],
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `PaymentApprovedNotificationListener: ${e.message}`,
        e.stack,
      );
    }
  }
}
