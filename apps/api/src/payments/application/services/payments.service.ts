import { Injectable } from '@nestjs/common';
import {
  CreateCheckoutInput,
  CreateCheckoutResult,
  CreateCheckoutUseCase,
} from '../use-cases/create-checkout.use-case';
import {
  CreatePaymentInput,
  CreatePaymentUseCase,
} from '../use-cases/create-payment.use-case';
import {
  CreateMpPreferenceUseCase,
} from '../use-cases/create-mp-preference.use-case';
import { GetMyPaymentsUseCase } from '../use-cases/get-my-payments.use-case';
import {
  GetPaymentStatusUseCase,
} from '../use-cases/get-payment-status.use-case';
import {
  GetPaymentSummaryUseCase,
} from '../use-cases/get-payment-summary.use-case';
import { GetPaymentUseCase } from '../use-cases/get-payment.use-case';
import {
  HandleMpWebhookInput,
  HandleMpWebhookUseCase,
} from '../use-cases/handle-mp-webhook.use-case';
import { ListPaymentsUseCase } from '../use-cases/list-payments.use-case';
import { MarkAsFailedUseCase } from '../use-cases/mark-as-failed.use-case';
import { MarkAsPaidUseCase } from '../use-cases/mark-as-paid.use-case';
import {
  UploadPaymentProofInput,
  UploadPaymentProofUseCase,
} from '../use-cases/upload-payment-proof.use-case';
import {
  IMercadoPagoPort,
  MERCADOPAGO_PORT,
} from '../ports/mercadopago.port';
import { Inject } from '@nestjs/common';

/**
 * Facade público de PaymentsModule para el controller. Convierte requests HTTP
 * a inputs de use-case y mantiene compatibilidad con el shape legacy donde el
 * `PaymentsController` llamaba `paymentsService.createCheckout(...)`.
 *
 * Esta clase NO se exporta del módulo — el controller la inyecta dentro del
 * mismo módulo. Lo que sí exporta el módulo es `RegistrationPaymentsService`.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly createCheckoutUseCase: CreateCheckoutUseCase,
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly createMpPreferenceUseCase: CreateMpPreferenceUseCase,
    private readonly getPaymentStatusUseCase: GetPaymentStatusUseCase,
    private readonly getPaymentUseCase: GetPaymentUseCase,
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly getMyPaymentsUseCase: GetMyPaymentsUseCase,
    private readonly getPaymentSummaryUseCase: GetPaymentSummaryUseCase,
    private readonly markAsPaidUseCase: MarkAsPaidUseCase,
    private readonly markAsFailedUseCase: MarkAsFailedUseCase,
    private readonly uploadProofUseCase: UploadPaymentProofUseCase,
    private readonly handleMpWebhookUseCase: HandleMpWebhookUseCase,
    @Inject(MERCADOPAGO_PORT)
    private readonly mp: IMercadoPagoPort,
  ) {}

  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    return this.createCheckoutUseCase.execute(input);
  }

  getPaymentStatus(paymentId: string) {
    return this.getPaymentStatusUseCase.execute(paymentId);
  }

  create(input: CreatePaymentInput) {
    return this.createPaymentUseCase.execute(input);
  }

  findAll(filter: Parameters<ListPaymentsUseCase['execute']>[0]) {
    return this.listPaymentsUseCase.execute(filter);
  }

  findOne(id: string) {
    return this.getPaymentUseCase.execute(id);
  }

  findByProfile(profileId: string, paginationDto: { page?: number; limit?: number }) {
    return this.getMyPaymentsUseCase.execute({
      profileId,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
  }

  getSummary(startDate?: Date, endDate?: Date) {
    return this.getPaymentSummaryUseCase.execute({ startDate, endDate });
  }

  markAsPaid(
    paymentId: string,
    body: { externalReference?: string; notes?: string },
    adminId: string,
  ) {
    return this.markAsPaidUseCase.execute({
      paymentId,
      adminId,
      externalReference: body.externalReference,
      notes: body.notes,
    });
  }

  markAsFailed(paymentId: string, reason: string) {
    return this.markAsFailedUseCase.execute({ paymentId, reason });
  }

  createMercadoPagoPreference(paymentId: string) {
    return this.createMpPreferenceUseCase.execute({ paymentId });
  }

  processMercadoPagoWebhook(input: HandleMpWebhookInput) {
    return this.handleMpWebhookUseCase.execute(input);
  }

  uploadPaymentProof(input: UploadPaymentProofInput) {
    return this.uploadProofUseCase.execute(input);
  }

  isMercadoPagoEnabled(): boolean {
    return this.mp.isEnabled();
  }
}
