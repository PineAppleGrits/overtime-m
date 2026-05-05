import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Legacy service — sigue exportándose para consumidores existentes
// (PaymentNotificationsAdapter, etc).
import { EmailService } from './services/email.service';

// Application
import { SendEmailUseCase } from './application/use-cases/send-email.use-case';
import { NotificationsService } from './application/services/notifications.service';
import { EMAIL_PORT } from './application/ports/email.port';
import { NOTIFICATION_CONTEXT_PORT } from './application/ports/notification-context.port';

// Infrastructure
import { ResendEmailAdapter } from './infrastructure/adapters/resend-email.adapter';
import { PrismaNotificationContextRepository } from './infrastructure/repositories/prisma-notification-context.repository';

// Listeners (un archivo por evento)
import { RegistrationApprovedListener } from './infrastructure/listeners/registration-approved.listener';
import { RegistrationRejectedListener } from './infrastructure/listeners/registration-rejected.listener';
import { FriendlyGeneratedListener } from './infrastructure/listeners/friendly-generated.listener';
import { FriendlyExpiredListener } from './infrastructure/listeners/friendly-expired.listener';
import { MatchRescheduledListener } from './infrastructure/listeners/match-rescheduled.listener';
import { MatchCancelledListener } from './infrastructure/listeners/match-cancelled.listener';
import { DebtOverdueDetectedListener } from './infrastructure/listeners/debt-overdue-detected.listener';
import { DebtFullyPaidListener } from './infrastructure/listeners/debt-fully-paid.listener';
import { SanctionCreatedListener } from './infrastructure/listeners/sanction-created.listener';
import { PaymentApprovedNotificationListener } from './infrastructure/listeners/payment-approved-notification.listener';
import { ProfileDniPendingReviewListener } from './infrastructure/listeners/profile-dni-pending-review.listener';

/**
 * W3.4 — Módulo Notifications (clean architecture).
 *
 * Estructura:
 * - `domain/templates`: funciones puras (data) → { subject, html, text }.
 * - `application`: ports + use-case `SendEmailUseCase` + facade `NotificationsService`.
 * - `infrastructure`:
 *    - `adapters/resend-email.adapter.ts`: implementa `IEmailPort` envolviendo `EmailService` legacy.
 *    - `repositories/prisma-notification-context.repository.ts`: lookups de contexto (perfiles/equipos/etc).
 *    - `listeners/`: un listener por evento del namespace `DomainEvent`.
 *
 * Persistencia: por ahora sólo Logger. Si se quiere trackear envíos, hay
 * que sumar tabla y migración (fuera de scope W3.4).
 */
@Module({
  imports: [DatabaseModule],
  providers: [
    // Legacy
    EmailService,

    // Application
    SendEmailUseCase,
    NotificationsService,

    // Port bindings
    { provide: EMAIL_PORT, useClass: ResendEmailAdapter },
    {
      provide: NOTIFICATION_CONTEXT_PORT,
      useClass: PrismaNotificationContextRepository,
    },

    // Listeners
    RegistrationApprovedListener,
    RegistrationRejectedListener,
    FriendlyGeneratedListener,
    FriendlyExpiredListener,
    MatchRescheduledListener,
    MatchCancelledListener,
    DebtOverdueDetectedListener,
    DebtFullyPaidListener,
    SanctionCreatedListener,
    PaymentApprovedNotificationListener,
    ProfileDniPendingReviewListener,
  ],
  exports: [
    EmailService, // legacy export — no romper consumidores existentes
    NotificationsService,
    EMAIL_PORT,
    NOTIFICATION_CONTEXT_PORT,
  ],
})
export class NotificationsModule {}
