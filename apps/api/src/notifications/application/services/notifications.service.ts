import { Injectable } from '@nestjs/common';
import { RenderedEmail } from '../../domain/templates';
import { SendEmailResult } from '../ports/email.port';
import { SendEmailUseCase } from '../use-cases/send-email.use-case';

/**
 * Facade interna del módulo Notifications. Los listeners (y futuros
 * adapters de notification.port externos) llaman a `send()`, que delega
 * al caso de uso genérico.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly sendEmail: SendEmailUseCase) {}

  async send(input: {
    to: string | string[];
    rendered: RenderedEmail;
    tags?: { name: string; value: string }[];
  }): Promise<SendEmailResult> {
    return this.sendEmail.execute(input);
  }
}
