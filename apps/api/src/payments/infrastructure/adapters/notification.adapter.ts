import { Injectable } from '@nestjs/common';
import { EmailService } from '../../../notifications/services/email.service';
import {
  IPaymentNotificationsPort,
  SendPaymentConfirmationInput,
} from '../../application/ports/notification.port';

/**
 * Adapter del puerto `IPaymentNotificationsPort` sobre el servicio
 * `EmailService` (notifications module).
 */
@Injectable()
export class PaymentNotificationsAdapter implements IPaymentNotificationsPort {
  constructor(private readonly email: EmailService) {}

  async sendPaymentConfirmation(
    input: SendPaymentConfirmationInput,
  ): Promise<void> {
    await this.email.sendPaymentConfirmation(
      input.to,
      input.recipientName,
      input.amount,
      input.currency,
      input.concept,
      input.paymentId,
    );
  }
}
