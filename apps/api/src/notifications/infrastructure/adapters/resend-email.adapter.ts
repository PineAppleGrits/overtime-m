import { Injectable } from '@nestjs/common';
import { EmailService } from '../../services/email.service';
import {
  IEmailPort,
  SendEmailInput,
  SendEmailResult,
} from '../../application/ports/email.port';

/**
 * Adapter del puerto `IEmailPort` sobre el `EmailService` legacy (Resend).
 *
 * Mantenemos el `EmailService` para no romper consumidores existentes
 * (PaymentNotificationsAdapter, etc). El nuevo flujo limpio pasa por
 * el puerto.
 */
@Injectable()
export class ResendEmailAdapter implements IEmailPort {
  constructor(private readonly email: EmailService) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    return this.email.send({
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      tags: input.tags,
    });
  }
}
