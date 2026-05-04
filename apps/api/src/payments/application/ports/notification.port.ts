/**
 * Puerto para enviar notificaciones (emails) de pago. Aísla a los use-cases
 * del módulo de notificaciones legacy. Implementación: adapter que delega
 * en `EmailService`.
 */
export interface SendPaymentConfirmationInput {
  to: string;
  recipientName: string;
  amount: number;
  currency: string;
  concept: string;
  paymentId: string;
}

export interface IPaymentNotificationsPort {
  sendPaymentConfirmation(input: SendPaymentConfirmationInput): Promise<void>;
}

export const PAYMENT_NOTIFICATIONS_PORT = Symbol('PAYMENT_NOTIFICATIONS_PORT');
