import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { registrationApprovedTemplate } from '../../domain/templates';
import { recipientFromTeam } from './listener.helpers';

/**
 * RN-013 — al aprobarse una inscripción, mandar email al delegado.
 */
@Injectable()
export class RegistrationApprovedListener {
  private readonly logger = new Logger(RegistrationApprovedListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.REGISTRATION_APPROVED)
  async handle(
    payload: DomainEventPayloads['registration.approved'],
  ): Promise<void> {
    try {
      const reg = await this.context.findRegistration(payload.registrationId);
      if (!reg) return;
      const recipient = recipientFromTeam(reg.team) ?? reg.requester;
      if (!recipient?.email) {
        this.logger.warn(
          `registration.approved: sin email para registration ${payload.registrationId}`,
        );
        return;
      }
      const rendered = registrationApprovedTemplate({
        recipientName: recipient.name,
        teamName: reg.team?.name ?? 'tu equipo',
        tournamentName: reg.tournamentName,
        categoryName: reg.categoryName ?? undefined,
      });
      await this.notifications.send({
        to: recipient.email,
        rendered,
        tags: [
          { name: 'type', value: 'registration_approved' },
          { name: 'registration_id', value: payload.registrationId },
        ],
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `RegistrationApprovedListener falló: ${e.message}`,
        e.stack,
      );
    }
  }
}
