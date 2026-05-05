import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { debtPaidTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

@Injectable()
export class DebtFullyPaidListener {
  private readonly logger = new Logger(DebtFullyPaidListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.DEBT_FULLY_PAID)
  async handle(payload: DomainEventPayloads['debt.fully.paid']): Promise<void> {
    try {
      const debt = await this.context.findDebt(payload.debtId);
      if (!debt) return;
      const recipient = debt.profile ?? recipientFromTeam(debt.team);
      if (!recipient?.email) return;
      const rendered = debtPaidTemplate({
        recipientName: recipient.name,
        debtConcept: debt.conceptLabel,
        amount: debt.amount,
        currency: debt.currency,
      });
      await this.notifications.send({
        to: recipient.email,
        rendered,
        tags: [
          { name: 'type', value: 'debt_paid' },
          { name: 'debt_id', value: payload.debtId },
        ],
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(`DebtFullyPaidListener: ${e.message}`, e.stack);
    }
  }
}
