import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { friendlyGeneratedTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

/**
 * RN-022 — al generarse un amistoso, notificar a ambos delegados con
 * recordatorio de seña + plazo (RN-023).
 */
@Injectable()
export class FriendlyGeneratedListener {
  private readonly logger = new Logger(FriendlyGeneratedListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.FRIENDLY_GENERATED)
  async handle(
    payload: DomainEventPayloads['friendly.generated'],
  ): Promise<void> {
    try {
      const friendly = await this.context.findFriendly(payload.friendlyId);
      if (!friendly) return;
      const recipients = [
        recipientFromTeam(friendly.homeTeam),
        recipientFromTeam(friendly.awayTeam),
      ].filter((r): r is { email: string; name: string } => !!r?.email);

      for (const recipient of recipients) {
        const rendered = friendlyGeneratedTemplate({
          recipientName: recipient.name,
          homeTeamName: friendly.homeTeam?.name ?? 'Local',
          awayTeamName: friendly.awayTeam?.name ?? 'Visitante',
          matchDate: friendly.matchDate ?? new Date(),
          venueName: friendly.venueName ?? undefined,
          depositDeadline: friendly.depositDeadline ?? undefined,
        });
        await this.notifications.send({
          to: recipient.email,
          rendered,
          tags: [{ name: 'type', value: 'friendly_generated' }],
        });
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error(`FriendlyGeneratedListener: ${e.message}`, e.stack);
    }
  }
}
