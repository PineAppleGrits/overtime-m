import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { DebtsService } from '../../../debts/application/services/debts.service';
import {
  IMercadoPagoPort,
  MERCADOPAGO_PORT,
  MpWebhookPayload,
} from '../ports/mercadopago.port';
import {
  IPaymentNotificationsPort,
  PAYMENT_NOTIFICATIONS_PORT,
} from '../ports/notification.port';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../ports/payment-repository.port';
import {
  IRegistrationContextPort,
  REGISTRATION_CONTEXT_PORT,
} from '../ports/registration-context.port';

export interface HandleMpWebhookInput {
  payload: MpWebhookPayload;
  xSignature?: string;
  xRequestId?: string;
}

export interface HandleMpWebhookResult {
  received: boolean;
  processed: boolean;
  paymentId?: string;
  newStatus?: string;
  mercadoPagoStatus?: string;
  error?: string;
}

/**
 * Procesa el webhook de MercadoPago. Si el pago se aprueba:
 * - actualiza el Payment a `procesado`,
 * - llama `DebtsService.applyPayment` cuando hay debtId,
 * - emite `PAYMENT_APPROVED` (RN-022 friendly listener + RN-060 listener),
 * - manda email de confirmación.
 */
@Injectable()
export class HandleMpWebhookUseCase {
  private readonly logger = new Logger(HandleMpWebhookUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    @Inject(MERCADOPAGO_PORT)
    private readonly mp: IMercadoPagoPort,
    @Inject(PAYMENT_NOTIFICATIONS_PORT)
    private readonly notifications: IPaymentNotificationsPort,
    @Inject(REGISTRATION_CONTEXT_PORT)
    private readonly registrationCtx: IRegistrationContextPort,
    private readonly debtsService: DebtsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: HandleMpWebhookInput,
  ): Promise<HandleMpWebhookResult> {
    const { payload, xSignature, xRequestId } = input;

    if (xSignature && xRequestId) {
      const valid = this.mp.validateWebhookSignature(
        xSignature,
        xRequestId,
        payload.data.id,
      );
      if (!valid) {
        throw new BusinessError(
          ErrorCode.UNAUTHORIZED,
          'Firma de webhook inválida',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    const result = await this.mp.processWebhook(payload);
    if (!result.processed || !result.paymentInfo) {
      return { received: true, processed: false, error: result.error };
    }

    const info = result.paymentInfo;
    const payment = await this.repo.findById(info.externalReference);
    if (!payment) {
      this.logger.warn(
        `Webhook: payment ${info.externalReference} no encontrado`,
      );
      return {
        received: true,
        processed: false,
        error: 'Payment not found',
      };
    }

    const newStatus = this.mp.mapPaymentStatus(info.status);
    const statusDescription = this.mp.getStatusDescription(
      info.status,
      info.statusDetail,
    );

    const updated = await this.repo.update(payment.id, {
      status: newStatus as never,
      processedAt: info.status === 'approved' ? new Date() : undefined,
      providerPaymentId: String(info.id),
      providerResponse: {
        mercadoPagoId: info.id,
        status: info.status,
        statusDetail: info.statusDetail,
        paymentMethod: info.paymentMethodId,
        paymentType: info.paymentTypeId,
        dateApproved: info.dateApproved,
        statusDescription,
      } as Prisma.InputJsonValue,
    });

    this.logger.log(
      `Webhook MP: payment ${payment.id} status ${payment.status} -> ${newStatus}`,
    );

    if (info.status === 'approved') {
      // Aplicar pago a la deuda. Si falla, dejamos el Payment como aprobado y
      // logueamos.
      if (payment.debtId) {
        try {
          await this.debtsService.applyPayment({
            debtId: payment.debtId,
            amount: new Prisma.Decimal(payment.amount),
            paidByProfileId: payment.profileId,
          });
        } catch (err) {
          const e = err as Error;
          this.logger.error(
            `Webhook MP: applyPayment falló para debt ${payment.debtId}: ${e.message}`,
            e.stack,
          );
        }
      } else if (payment.registrationId) {
        // Legacy: marcar registration pagada.
        try {
          await this.registrationCtx.markPaid(payment.registrationId);
        } catch (err) {
          // best-effort
        }
      }

      const approvedPayload: DomainEventPayloads['payment.approved'] = {
        paymentId: updated.id,
        debtId: updated.debtId ?? undefined,
        approvedBy: payment.profileId,
        method: 'mercadopago',
      };
      this.eventEmitter.emit(DomainEvent.PAYMENT_APPROVED, approvedPayload);

      // Email confirmación.
      if (payment.profile?.email) {
        let concept = 'Pago Overtime';
        if (payment.registration) {
          concept = `Inscripción: ${payment.registration.team.name} - ${payment.registration.tournament.name}`;
        } else if (payment.match) {
          concept = `Partido: ${payment.match.homeTeam?.name ?? 'TBD'} vs ${payment.match.awayTeam?.name ?? 'TBD'}`;
        } else if (payment.debt) {
          concept = payment.debt.concept;
        }

        try {
          await this.notifications.sendPaymentConfirmation({
            to: payment.profile.email,
            recipientName: payment.profile.name,
            amount: payment.amount,
            currency: payment.currency,
            concept,
            paymentId: payment.id,
          });
        } catch (err) {
          // best-effort
        }
      }
    } else if (
      info.status === 'rejected' ||
      info.status === 'cancelled'
    ) {
      const rejectedPayload: DomainEventPayloads['payment.rejected'] = {
        paymentId: updated.id,
        reason: info.statusDetail || info.status,
      };
      this.eventEmitter.emit(DomainEvent.PAYMENT_REJECTED, rejectedPayload);
    }

    return {
      received: true,
      processed: true,
      paymentId: updated.id,
      newStatus,
      mercadoPagoStatus: info.status,
    };
  }
}
