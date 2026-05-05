import { Inject, Injectable, Logger } from '@nestjs/common';
import { RenderedEmail } from '../../domain/templates';
import { EMAIL_PORT, IEmailPort, SendEmailResult } from '../ports/email.port';

export interface SendEmailUseCaseInput {
  to: string | string[];
  rendered: RenderedEmail;
  tags?: { name: string; value: string }[];
}

/**
 * Caso de uso genérico — envía un template ya renderizado vía el puerto
 * de email. Siempre devuelve un resultado (no relanza), para que los
 * listeners no interrumpan el flujo del evento del que dependen.
 */
@Injectable()
export class SendEmailUseCase {
  private readonly logger = new Logger(SendEmailUseCase.name);

  constructor(@Inject(EMAIL_PORT) private readonly email: IEmailPort) {}

  async execute(input: SendEmailUseCaseInput): Promise<SendEmailResult> {
    if (!input.to || (Array.isArray(input.to) && input.to.length === 0)) {
      this.logger.warn(
        `SendEmailUseCase: skip — sin destinatario para "${input.rendered.subject}"`,
      );
      return { success: false, error: 'no_recipient' };
    }

    try {
      return await this.email.send({
        to: input.to,
        subject: input.rendered.subject,
        html: input.rendered.html,
        text: input.rendered.text,
        tags: input.tags,
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `SendEmailUseCase falló para ${JSON.stringify(input.to)}: ${e.message}`,
        e.stack,
      );
      return { success: false, error: e.message };
    }
  }
}
