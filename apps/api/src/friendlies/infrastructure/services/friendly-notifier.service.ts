import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../../notifications/services/email.service';
import {
  FriendlyGeneratedEmailInput,
  IFriendlyNotifier,
} from '../../application/ports/friendly-notifier.port';

@Injectable()
export class FriendlyNotifierService implements IFriendlyNotifier {
  private readonly logger = new Logger(FriendlyNotifierService.name);

  constructor(private readonly emailService: EmailService) {}

  async notifyGenerated(input: FriendlyGeneratedEmailInput): Promise<void> {
    if (input.recipients.length === 0) return;

    const proposedDateStr = input.proposedDate.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const deadlineStr = input.confirmationDeadline.toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: input.currency,
    }).format(input.depositAmount);

    const subject = `Amistoso generado: ${input.homeTeamName} vs ${input.awayTeamName}`;

    // Enviamos un email por destinatario para personalizar el saludo.
    await Promise.all(
      input.recipients.map(async (recipient) => {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .info { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .warning { background: #fff3e0; padding: 15px; border-radius: 4px; border-left: 4px solid #ff9800; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Overtime</h1>
                </div>
                <div class="content">
                  <h2>Amistoso generado</h2>
                  <p>Hola ${recipient.name},</p>
                  <p>La organización generó el amistoso entre <strong>${input.homeTeamName}</strong> y <strong>${input.awayTeamName}</strong>.</p>
                  <div class="info">
                    <strong>Detalles:</strong><br />
                    Fecha propuesta: ${proposedDateStr}<br />
                    Seña por equipo: ${formattedAmount}
                  </div>
                  <div class="warning">
                    <strong>Importante:</strong> cada equipo debe pagar la seña antes de
                    <strong>${deadlineStr}</strong> para confirmar el partido.
                    Si no se paga a tiempo, el amistoso se cancela automáticamente (RN-023).
                  </div>
                  <p>Ingresá a la plataforma para abonar la seña.</p>
                </div>
                <div class="footer">
                  <p>Este email fue enviado por Overtime.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const result = await this.emailService.send({
          to: recipient.email,
          subject,
          html,
          tags: [{ name: 'type', value: 'friendly_generated' }],
        });
        if (!result.success) {
          this.logger.warn(
            `Email amistoso generado a ${recipient.email} falló: ${result.error}`,
          );
        }
      }),
    );
  }
}
