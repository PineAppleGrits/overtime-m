/**
 * Puerto del adaptador de MercadoPago. Aísla al dominio del SDK concreto.
 *
 * Implementación: `infrastructure/adapters/mercadopago.adapter.ts` que
 * envuelve a `services/mercadopago.service.ts` (legacy, no se borra).
 */

export interface CreateMpPreferenceOptions {
  paymentId: string;
  title: string;
  description: string;
  amount: number;
  currency?: string;
  payerEmail: string;
  payerName?: string;
  externalReference?: string;
  metadata?: Record<string, unknown>;
}

export interface MpPreferenceResult {
  success: boolean;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  error?: string;
}

export interface MpPaymentInfo {
  id: number;
  status: string;
  statusDetail: string;
  externalReference: string;
  transactionAmount: number;
  currencyId: string;
  paymentMethodId: string;
  paymentTypeId: string;
  dateApproved?: string;
  payer: { email: string; id?: string };
}

export interface MpWebhookPayload {
  action: string;
  api_version?: string;
  data: { id: string };
  date_created?: string;
  id?: number;
  live_mode?: boolean;
  type: string;
  user_id?: string;
}

export interface MpWebhookResult {
  processed: boolean;
  paymentInfo?: MpPaymentInfo;
  action?: string;
  error?: string;
}

/**
 * Mapea estado nativo de MP al string que usamos internamente
 * (`procesado`, `pendiente`, `fallido`, etc.).
 */
export interface IMercadoPagoPort {
  isEnabled(): boolean;
  createPreference(
    options: CreateMpPreferenceOptions,
  ): Promise<MpPreferenceResult>;
  getPaymentInfo(mpPaymentId: string): Promise<MpPaymentInfo | null>;
  processWebhook(payload: MpWebhookPayload): Promise<MpWebhookResult>;
  validateWebhookSignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string,
  ): boolean;
  mapPaymentStatus(mpStatus: string): string;
  getStatusDescription(status: string, statusDetail: string): string;
}

export const MERCADOPAGO_PORT = Symbol('MERCADOPAGO_PORT');
