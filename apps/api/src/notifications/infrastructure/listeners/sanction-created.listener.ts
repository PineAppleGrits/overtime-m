import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { sanctionCreatedTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

@Injectable()
export class SanctionCreatedListener {
  private readonly logger = new Logger(SanctionCreatedListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.SANCTION_CREATED)
  async handle(
    payload: DomainEventPayloads['sanction.created'],
  ): Promise<void> {
    try {
      const sanction = await this.context.findSanction(payload.sanctionId);
      if (!sanction) return;
      const recipient =
        sanction.targetProfile ?? recipientFromTeam(sanction.targetTeam);
      if (!recipient?.email) return;
      const rendered = sanctionCreatedTemplate({
        recipientName: recipient.name,
        sanctionType: sanction.type,
        description: sanction.description ?? undefined,
        fechasAffected: sanction.fechasAffected ?? undefined,
      });
      await this.notifications.send({
        to: recipient.email,
        rendered,
        tags: [
          { name: 'type', value: 'sanction_created' },
          { name: 'sanction_id', value: payload.sanctionId },
        ],
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(`SanctionCreatedListener: ${e.message}`, e.stack);
    }
  }
}
