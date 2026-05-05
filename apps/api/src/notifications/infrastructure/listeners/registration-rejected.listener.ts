import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { registrationRejectedTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

@Injectable()
export class RegistrationRejectedListener {
  private readonly logger = new Logger(RegistrationRejectedListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.REGISTRATION_REJECTED)
  async handle(
    payload: DomainEventPayloads['registration.rejected'],
  ): Promise<void> {
    try {
      const reg = await this.context.findRegistration(payload.registrationId);
      if (!reg) return;
      const recipient = recipientFromTeam(reg.team) ?? reg.requester;
      if (!recipient?.email) return;
      const rendered = registrationRejectedTemplate({
        recipientName: recipient.name,
        teamName: reg.team?.name ?? 'tu equipo',
        tournamentName: reg.tournamentName,
        reason: payload.reason ?? reg.rejectionReason ?? undefined,
      });
      await this.notifications.send({
        to: recipient.email,
        rendered,
        tags: [{ name: 'type', value: 'registration_rejected' }],
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(`RegistrationRejectedListener: ${e.message}`, e.stack);
    }
  }
}
