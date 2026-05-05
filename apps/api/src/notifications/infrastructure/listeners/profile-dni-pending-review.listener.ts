import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  INotificationContextPort,
  NOTIFICATION_CONTEXT_PORT,
} from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { dniPendingReviewTemplate } from '../../domain/templates';

/**
 * RN-036 / DP-009 — al subir DNI un usuario, si la verificación automática
 * no validó (stub actual), notificamos a admins para revisión manual.
 */
@Injectable()
export class ProfileDniPendingReviewListener {
  private readonly logger = new Logger(
    ProfileDniPendingReviewListener.name,
  );

  constructor(
    @Inject(NOTIFICATION_CONTEXT_PORT)
    private readonly context: INotificationContextPort,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(DomainEvent.PROFILE_DNI_PENDING_REVIEW)
  async handle(
    payload: DomainEventPayloads['profile.dni.pendingReview'],
  ): Promise<void> {
    try {
      const profile = await this.context.findProfile(payload.profileId);
      if (!profile) return;

      const admins = await this.context.findAdminsWithEmail();
      const adminEmails = admins
        .map((a) => a.email)
        .filter((e): e is string => !!e);
      if (adminEmails.length === 0) {
        this.logger.warn(
          'profile.dni.pendingReview: no hay admins con email para notificar',
        );
        return;
      }
      for (const admin of admins) {
        if (!admin.email) continue;
        const rendered = dniPendingReviewTemplate({
          recipientName: admin.name,
          profileId: profile.id,
          profileName: profile.name,
        });
        await this.notifications.send({
          to: admin.email,
          rendered,
          tags: [
            { name: 'type', value: 'dni_pending_review' },
            { name: 'profile_id', value: profile.id },
          ],
        });
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `ProfileDniPendingReviewListener: ${e.message}`,
        e.stack,
      );
    }
  }
}
