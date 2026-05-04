import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PricingModule } from '../pricing/pricing.module';

// Application — services (facade)
import { PaymentsService } from './application/services/payments.service';
import { RegistrationPaymentsService } from './application/services/registration-payments.service';

// Application — use cases
import { CreateCheckoutUseCase } from './application/use-cases/create-checkout.use-case';
import { CreateMpPreferenceUseCase } from './application/use-cases/create-mp-preference.use-case';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { GetMyPaymentsUseCase } from './application/use-cases/get-my-payments.use-case';
import { GetPaymentStatusUseCase } from './application/use-cases/get-payment-status.use-case';
import { GetPaymentSummaryUseCase } from './application/use-cases/get-payment-summary.use-case';
import { GetPaymentUseCase } from './application/use-cases/get-payment.use-case';
import { HandleMpWebhookUseCase } from './application/use-cases/handle-mp-webhook.use-case';
import { ListPaymentsUseCase } from './application/use-cases/list-payments.use-case';
import { MarkAsFailedUseCase } from './application/use-cases/mark-as-failed.use-case';
import { MarkAsPaidUseCase } from './application/use-cases/mark-as-paid.use-case';
import { UploadPaymentProofUseCase } from './application/use-cases/upload-payment-proof.use-case';

// Application — port symbols
import { DEBT_CONTEXT_PORT } from './application/ports/debt-context.port';
import { MATCH_CONTEXT_PORT } from './application/ports/match-context.port';
import { MERCADOPAGO_PORT } from './application/ports/mercadopago.port';
import { PAYMENT_NOTIFICATIONS_PORT } from './application/ports/notification.port';
import { PAYMENT_REPOSITORY } from './application/ports/payment-repository.port';
import { PROFILE_CONTEXT_PORT } from './application/ports/profile-context.port';
import { PROOF_STORAGE_PORT } from './application/ports/proof-storage.port';
import { REGISTRATION_CONTEXT_PORT } from './application/ports/registration-context.port';

// Infrastructure — adapters
import { MercadoPagoAdapter } from './infrastructure/adapters/mercadopago.adapter';
import { PaymentNotificationsAdapter } from './infrastructure/adapters/notification.adapter';
import { ProofStorageAdapter } from './infrastructure/adapters/proof-storage.adapter';

// Infrastructure — listeners
import { PaymentApprovedListener } from './infrastructure/listeners/payment-approved.listener';

// Infrastructure — repositories
import { PrismaDebtContextRepository } from './infrastructure/repositories/prisma-debt-context.repository';
import { PrismaMatchContextRepository } from './infrastructure/repositories/prisma-match-context.repository';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';
import { PrismaProfileContextRepository } from './infrastructure/repositories/prisma-profile-context.repository';
import { PrismaRegistrationContextRepository } from './infrastructure/repositories/prisma-registration-context.repository';

// Legacy MP service (sigue existiendo, encapsulado por el adapter).
import { MercadoPagoService } from './services/mercadopago.service';

// Presentation
import { PaymentsController } from './presentation/controllers/payments.controller';
import { RegistrationPaymentsController } from './presentation/controllers/registration-payments.controller';

/**
 * W2.2 — Módulo Payments (clean architecture).
 *
 * Cubre:
 * - RN-013/RN-014: postulación + comprobante (upload-proof, RN-060 listener).
 * - RN-015/RN-016/RN-017: entry fee + insurances; estado agregado.
 * - RN-022: señas de amistosos (debtId tipo FRIENDLY_DEPOSIT — el listener
 *   `friendlies` ya escucha PAYMENT_APPROVED).
 * - RN-060: borrado automático del comprobante (3 días post-aprobación).
 *
 * Exports:
 * - `RegistrationPaymentsService` — port para que el futuro
 *   `RegistrationsModule` lo invoque al aprobar postulaciones.
 *
 * Dependencias importadas:
 * - `DebtsModule` (W2.1) — `DebtsService.applyPayment` / `createInternal`.
 * - `PricingModule` (W2.3) — `PricingService.computeRegistrationFee`.
 * - `NotificationsModule` — `EmailService` para confirmación.
 */
@Module({
  imports: [DatabaseModule, NotificationsModule, DebtsModule, PricingModule],
  controllers: [PaymentsController, RegistrationPaymentsController],
  providers: [
    // Facade
    PaymentsService,
    RegistrationPaymentsService,

    // Use cases
    CreateCheckoutUseCase,
    CreateMpPreferenceUseCase,
    CreatePaymentUseCase,
    GetMyPaymentsUseCase,
    GetPaymentStatusUseCase,
    GetPaymentSummaryUseCase,
    GetPaymentUseCase,
    HandleMpWebhookUseCase,
    ListPaymentsUseCase,
    MarkAsFailedUseCase,
    MarkAsPaidUseCase,
    UploadPaymentProofUseCase,

    // Port → adapter / repo bindings
    { provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
    { provide: MERCADOPAGO_PORT, useClass: MercadoPagoAdapter },
    { provide: PROOF_STORAGE_PORT, useClass: ProofStorageAdapter },
    { provide: PAYMENT_NOTIFICATIONS_PORT, useClass: PaymentNotificationsAdapter },
    { provide: DEBT_CONTEXT_PORT, useClass: PrismaDebtContextRepository },
    {
      provide: REGISTRATION_CONTEXT_PORT,
      useClass: PrismaRegistrationContextRepository,
    },
    { provide: MATCH_CONTEXT_PORT, useClass: PrismaMatchContextRepository },
    { provide: PROFILE_CONTEXT_PORT, useClass: PrismaProfileContextRepository },

    // Legacy SDK service (lo envuelve MercadoPagoAdapter).
    MercadoPagoService,

    // Listeners
    PaymentApprovedListener,
  ],
  exports: [RegistrationPaymentsService],
})
export class PaymentsModule {}
