import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Payment, Preference } from 'mercadopago';

export interface CreatePreferenceOptions {
  paymentId: string;
  title: string;
  description: string;
  amount: number;
  quantity?: number;
  payerEmail: string;
  payerName?: string;
  externalReference?: string;
  metadata?: Record<string, any>;
}

export interface PreferenceResult {
  success: boolean;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  error?: string;
}

export interface PaymentInfo {
  id: number;
  status: string;
  statusDetail: string;
  externalReference: string;
  transactionAmount: number;
  currencyId: string;
  paymentMethodId: string;
  paymentTypeId: string;
  dateApproved?: string;
  payer: {
    email: string;
    id?: string;
  };
}

export interface WebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig | null;
  private readonly preference: Preference | null;
  private readonly payment: Payment | null;
  private readonly enabled: boolean;
  private readonly successUrl: string;
  private readonly failureUrl: string;
  private readonly pendingUrl: string;
  private readonly notificationUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('mercadopago.accessToken');
    this.enabled = this.configService.get<boolean>('mercadopago.enabled') || false;
    this.successUrl = this.configService.get<string>('mercadopago.successUrl') || '';
    this.failureUrl = this.configService.get<string>('mercadopago.failureUrl') || '';
    this.pendingUrl = this.configService.get<string>('mercadopago.pendingUrl') || '';
    this.notificationUrl = this.configService.get<string>('mercadopago.notificationUrl') || '';

    if (accessToken && this.enabled) {
      this.client = new MercadoPagoConfig({ accessToken });
      this.preference = new Preference(this.client);
      this.payment = new Payment(this.client);
      this.logger.log('MercadoPago service initialized');
    } else {
      this.client = null;
      this.preference = null;
      this.payment = null;
      this.logger.warn('MercadoPago service is disabled or access token not configured');
    }
  }

  /**
   * Check if MercadoPago is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Create a payment preference for checkout
   */
  async createPreference(options: CreatePreferenceOptions): Promise<PreferenceResult> {
    if (!this.preference || !this.enabled) {
      this.logger.log(`[MERCADOPAGO DISABLED] Would create preference for: ${options.title}`);
      return {
        success: true,
        preferenceId: 'disabled-mode',
        initPoint: 'https://mercadopago.com/disabled',
        sandboxInitPoint: 'https://sandbox.mercadopago.com/disabled',
      };
    }

    try {
      const response = await this.preference.create({
        body: {
          items: [
            {
              id: options.paymentId,
              title: options.title,
              description: options.description,
              quantity: options.quantity || 1,
              unit_price: options.amount,
              currency_id: 'ARS',
            },
          ],
          payer: {
            email: options.payerEmail,
            name: options.payerName,
          },
          back_urls: {
            success: this.successUrl,
            failure: this.failureUrl,
            pending: this.pendingUrl,
          },
          auto_return: 'approved',
          external_reference: options.externalReference || options.paymentId,
          notification_url: this.notificationUrl || undefined,
          metadata: {
            payment_id: options.paymentId,
            ...options.metadata,
          },
          statement_descriptor: 'OVERTIME',
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
      });

      this.logger.log(`MercadoPago preference created: ${response.id}`);

      return {
        success: true,
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
      };
    } catch (error) {
      this.logger.error(`Error creating MercadoPago preference: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment information by payment ID
   */
  async getPaymentInfo(mercadoPagoPaymentId: string): Promise<PaymentInfo | null> {
    if (!this.payment || !this.enabled) {
      this.logger.log(`[MERCADOPAGO DISABLED] Would get payment info for: ${mercadoPagoPaymentId}`);
      return null;
    }

    try {
      const response = await this.payment.get({ id: mercadoPagoPaymentId });

      return {
        id: response.id!,
        status: response.status!,
        statusDetail: response.status_detail!,
        externalReference: response.external_reference!,
        transactionAmount: response.transaction_amount!,
        currencyId: response.currency_id!,
        paymentMethodId: response.payment_method_id!,
        paymentTypeId: response.payment_type_id!,
        dateApproved: response.date_approved || undefined,
        payer: {
          email: response.payer?.email || '',
          id: response.payer?.id,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting payment info: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhook(payload: WebhookPayload): Promise<{
    processed: boolean;
    paymentInfo?: PaymentInfo;
    action?: string;
    error?: string;
  }> {
    this.logger.log(`Processing webhook: type=${payload.type}, action=${payload.action}`);

    // Only process payment notifications
    if (payload.type !== 'payment') {
      this.logger.log(`Ignoring non-payment webhook type: ${payload.type}`);
      return { processed: false, action: 'ignored' };
    }

    const paymentId = payload.data.id;

    // Get payment details from MercadoPago
    const paymentInfo = await this.getPaymentInfo(paymentId);

    if (!paymentInfo) {
      this.logger.error(`Could not retrieve payment info for: ${paymentId}`);
      return { processed: false, error: 'Could not retrieve payment info' };
    }

    this.logger.log(
      `Payment ${paymentId}: status=${paymentInfo.status}, external_reference=${paymentInfo.externalReference}`,
    );

    return {
      processed: true,
      paymentInfo,
      action: payload.action,
    };
  }

  /**
   * Validate webhook signature (if webhook secret is configured)
   */
  validateWebhookSignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string,
  ): boolean {
    const webhookSecret = this.configService.get<string>('mercadopago.webhookSecret');

    if (!webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping signature validation');
      return true;
    }

    if (!xSignature || !xRequestId) {
      this.logger.warn('Missing signature headers');
      return false;
    }

    // Parse the x-signature header
    // Format: ts=timestamp,v1=signature
    const parts = xSignature.split(',');
    const timestamp = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
    const signature = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signature) {
      this.logger.warn('Invalid signature format');
      return false;
    }

    // Build the signed payload
    // manifest = id:requestId;ts:timestamp;
    const crypto = require('crypto');
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');

    const isValid = signature === expectedSignature;

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
    }

    return isValid;
  }

  /**
   * Map MercadoPago status to our payment status
   */
  mapPaymentStatus(mpStatus: string): string {
    const statusMap: Record<string, string> = {
      approved: 'procesado',
      pending: 'pendiente',
      in_process: 'procesando',
      rejected: 'fallido',
      refunded: 'reembolsado',
      cancelled: 'fallido',
      charged_back: 'reembolsado',
    };

    return statusMap[mpStatus] || 'pendiente';
  }

  /**
   * Get human-readable status description
   */
  getStatusDescription(status: string, statusDetail: string): string {
    const descriptions: Record<string, string> = {
      accredited: 'Pago acreditado',
      pending_contingency: 'Pago pendiente de revisión',
      pending_review_manual: 'Pago en revisión manual',
      cc_rejected_bad_filled_card_number: 'Número de tarjeta incorrecto',
      cc_rejected_bad_filled_date: 'Fecha de vencimiento incorrecta',
      cc_rejected_bad_filled_other: 'Datos incorrectos',
      cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
      cc_rejected_blacklist: 'Tarjeta rechazada',
      cc_rejected_call_for_authorize: 'Debe autorizar el pago',
      cc_rejected_card_disabled: 'Tarjeta deshabilitada',
      cc_rejected_card_error: 'Error en la tarjeta',
      cc_rejected_duplicated_payment: 'Pago duplicado',
      cc_rejected_high_risk: 'Pago rechazado por riesgo',
      cc_rejected_insufficient_amount: 'Fondos insuficientes',
      cc_rejected_invalid_installments: 'Cuotas inválidas',
      cc_rejected_max_attempts: 'Máximo de intentos alcanzado',
      cc_rejected_other_reason: 'Pago rechazado',
    };

    return descriptions[statusDetail] || `Estado: ${status}`;
  }
}
