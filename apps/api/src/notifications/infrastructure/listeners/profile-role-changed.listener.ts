import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { profileRoleChangedTemplate } from '../../domain/templates';

@Injectable()
export class ProfileRoleChangedListener {
  private readonly logger = new Logger(ProfileRoleChangedListener.name);

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.PROFILE_ROLE_CHANGED)
  async handle(
    payload: DomainEventPayloads['profile.role.changed'],
  ): Promise<void> {
    try {
      const profile = await this.context.findProfile(payload.profileId);
      if (!profile?.email) {
        this.logger.warn(
          `profile.role.changed: sin email para profile ${payload.profileId}`,
        );
        return;
      }

      const rendered = profileRoleChangedTemplate({
        recipientName: profile.name,
        fromRole: payload.fromRole,
        toRole: payload.toRole,
      });

      await this.notifications.send({
        to: profile.email,
        rendered,
        tags: [
          { name: 'type', value: 'profile_role_changed' },
          { name: 'profile_id', value: payload.profileId },
        ],
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(`ProfileRoleChangedListener: ${e.message}`, e.stack);
    }
  }
}
