import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { debtOverdueTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

/**
 * RN-025 a RN-031 — al detectarse deuda vencida (cron), notificar al
 * deudor (perfil o delegado del equipo).
 */
@Injectable()
export class DebtOverdueDetectedListener {
  private readonly logger = new Logger(DebtOverdueDetectedListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.DEBT_OVERDUE_DETECTED)
  async handle(
    payload: DomainEventPayloads['debt.overdue.detected'],
  ): Promise<void> {
    try {
      const debt = await this.context.findDebt(payload.debtId);
      if (!debt) return;
      const recipient = debt.profile ?? recipientFromTeam(debt.team);
      if (!recipient?.email) return;

      const daysOverdue = debt.dueDate
        ? Math.max(
            0,
            Math.floor((Date.now() - debt.dueDate.getTime()) / (24 * 60 * 60 * 1000)),
          )
        : undefined;

      const rendered = debtOverdueTemplate({
        recipientName: recipient.name,
        debtConcept: debt.conceptLabel,
        amount: debt.amount,
        currency: debt.currency,
        daysOverdue,
      });
      await this.notifications.send({
        to: recipient.email,
        rendered,
        tags: [
          { name: 'type', value: 'debt_overdue' },
          { name: 'debt_id', value: payload.debtId },
        ],
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(`DebtOverdueDetectedListener: ${e.message}`, e.stack);
    }
  }
}
