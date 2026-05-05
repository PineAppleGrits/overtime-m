import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { friendlyExpiredTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

@Injectable()
export class FriendlyExpiredListener {
  private readonly logger = new Logger(FriendlyExpiredListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.FRIENDLY_EXPIRED)
  async handle(
    payload: DomainEventPayloads['friendly.expired'],
  ): Promise<void> {
    try {
      const friendly = await this.context.findFriendly(payload.friendlyId);
      if (!friendly) return;
      const recipients = [
        recipientFromTeam(friendly.homeTeam),
        recipientFromTeam(friendly.awayTeam),
      ].filter((r): r is { email: string; name: string } => !!r?.email);

      for (const recipient of recipients) {
        const rendered = friendlyExpiredTemplate({
          recipientName: recipient.name,
          homeTeamName: friendly.homeTeam?.name ?? 'Local',
          awayTeamName: friendly.awayTeam?.name ?? 'Visitante',
        });
        await this.notifications.send({
          to: recipient.email,
          rendered,
          tags: [{ name: 'type', value: 'friendly_expired' }],
        });
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error(`FriendlyExpiredListener: ${e.message}`, e.stack);
    }
  }
}
