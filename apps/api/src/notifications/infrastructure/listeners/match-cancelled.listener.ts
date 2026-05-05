import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { matchCancelledTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

@Injectable()
export class MatchCancelledListener {
  private readonly logger = new Logger(MatchCancelledListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.MATCH_CANCELLED)
  async handle(
    payload: DomainEventPayloads['match.cancelled'],
  ): Promise<void> {
    try {
      const match = await this.context.findMatch(payload.matchId);
      if (!match) return;
      const recipients = [
        recipientFromTeam(match.homeTeam),
        recipientFromTeam(match.awayTeam),
      ].filter((r): r is { email: string; name: string } => !!r?.email);

      for (const recipient of recipients) {
        const rendered = matchCancelledTemplate({
          recipientName: recipient.name,
          homeTeamName: match.homeTeam?.name ?? 'Local',
          awayTeamName: match.awayTeam?.name ?? 'Visitante',
          reason: payload.reason,
          requiresRivalDecision: payload.requiresRivalDecision,
        });
        await this.notifications.send({
          to: recipient.email,
          rendered,
          tags: [{ name: 'type', value: 'match_cancelled' }],
        });
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error(`MatchCancelledListener: ${e.message}`, e.stack);
    }
  }
}
