import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { matchRescheduledTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

@Injectable()
export class MatchRescheduledListener {
  private readonly logger = new Logger(MatchRescheduledListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.MATCH_RESCHEDULED)
  async handle(
    payload: DomainEventPayloads['match.rescheduled'],
  ): Promise<void> {
    try {
      const match = await this.context.findMatch(payload.matchId);
      if (!match) return;
      const recipients = [
        recipientFromTeam(match.homeTeam),
        recipientFromTeam(match.awayTeam),
      ].filter((r): r is { email: string; name: string } => !!r?.email);

      for (const recipient of recipients) {
        const rendered = matchRescheduledTemplate({
          recipientName: recipient.name,
          homeTeamName: match.homeTeam?.name ?? 'Local',
          awayTeamName: match.awayTeam?.name ?? 'Visitante',
          previousDate: payload.previousDate,
          newDate: payload.newDate,
          reason: payload.reason,
        });
        await this.notifications.send({
          to: recipient.email,
          rendered,
          tags: [{ name: 'type', value: 'match_rescheduled' }],
        });
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error(`MatchRescheduledListener: ${e.message}`, e.stack);
    }
  }
}
