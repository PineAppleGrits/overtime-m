import { Injectable } from '@nestjs/common';
import {
  CreateMpPreferenceOptions,
  IMercadoPagoPort,
  MpPaymentInfo,
  MpPreferenceResult,
  MpWebhookPayload,
  MpWebhookResult,
} from '../../application/ports/mercadopago.port';
import { MercadoPagoService } from '../../services/mercadopago.service';

/**
 * Adapter que envuelve el servicio legacy de MercadoPago. Permite que los
 * use-cases dependan del puerto en vez de del SDK.
 *
 * El servicio legacy (`services/mercadopago.service.ts`) sigue existiendo —
 * encapsula el SDK oficial. Este adapter sólo re-expone su API en términos
 * del puerto (`IMercadoPagoPort`).
 */
@Injectable()
export class MercadoPagoAdapter implements IMercadoPagoPort {
  constructor(private readonly legacy: MercadoPagoService) {}

  isEnabled(): boolean {
    return this.legacy.isEnabled();
  }

  createPreference(
    options: CreateMpPreferenceOptions,
  ): Promise<MpPreferenceResult> {
    return this.legacy.createPreference({
      paymentId: options.paymentId,
      title: options.title,
      description: options.description,
      amount: options.amount,
      payerEmail: options.payerEmail,
      payerName: options.payerName,
      externalReference: options.externalReference,
      metadata: options.metadata,
    });
  }

  getPaymentInfo(mpPaymentId: string): Promise<MpPaymentInfo | null> {
    return this.legacy.getPaymentInfo(mpPaymentId) as Promise<MpPaymentInfo | null>;
  }

  processWebhook(payload: MpWebhookPayload): Promise<MpWebhookResult> {
    return this.legacy.processWebhook({
      action: payload.action,
      api_version: payload.api_version ?? '',
      data: payload.data,
      date_created: payload.date_created ?? new Date().toISOString(),
      id: payload.id ?? 0,
      live_mode: payload.live_mode ?? false,
      type: payload.type,
      user_id: payload.user_id ?? '',
    }) as Promise<MpWebhookResult>;
  }

  validateWebhookSignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string,
  ): boolean {
    return this.legacy.validateWebhookSignature(xSignature, xRequestId, dataId);
  }

  mapPaymentStatus(mpStatus: string): string {
    return this.legacy.mapPaymentStatus(mpStatus);
  }

  getStatusDescription(status: string, statusDetail: string): string {
    return this.legacy.getStatusDescription(status, statusDetail);
  }
}
