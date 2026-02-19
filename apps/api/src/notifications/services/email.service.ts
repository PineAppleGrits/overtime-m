import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly replyToEmail: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.fromEmail = this.configService.get<string>('resend.fromEmail') || 'Overtime <noreply@overtime.com>';
    this.replyToEmail = this.configService.get<string>('resend.replyToEmail') || '';
    this.enabled = this.configService.get<boolean>('resend.enabled') || false;

    if (apiKey && this.enabled) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.resend = null;
      this.logger.warn('Resend email service is disabled or API key not configured');
    }
  }

  /**
   * Send an email using Resend
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    if (!this.resend || !this.enabled) {
      this.logger.log(`[EMAIL DISABLED] Would send to: ${options.to}, subject: ${options.subject}`);
      return { success: true, id: 'disabled-mode' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || this.replyToEmail || undefined,
        tags: options.tags,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return { success: false, error: error.message };
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      return { success: true, id: data?.id };
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send registration approved email
   */
  async sendRegistrationApproved(
    email: string,
    name: string,
    teamName: string,
    tournamentName: string,
    categoryName: string,
  ): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight { background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏀 Overtime</h1>
            </div>
            <div class="content">
              <h2>¡Inscripción Aprobada!</h2>
              <p>Hola ${name},</p>
              <p>Tu inscripción ha sido aprobada. ¡Ya pueden participar en el torneo!</p>
              
              <div class="highlight">
                <strong>Detalles:</strong><br>
                📋 Equipo: ${teamName}<br>
                🏆 Torneo: ${tournamentName}<br>
                📊 Categoría: ${categoryName}
              </div>
              
              <p>Ingresa a la plataforma para ver el fixture y los horarios de tus partidos.</p>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/my-teams" class="button">Ver mis equipos</a>
              </p>
            </div>
            <div class="footer">
              <p>Este email fue enviado por Overtime. Si no solicitaste esto, puedes ignorar este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `✅ Inscripción aprobada: ${teamName} en ${tournamentName}`,
      html,
      tags: [
        { name: 'type', value: 'registration_approved' },
        { name: 'tournament', value: tournamentName },
      ],
    });
  }

  /**
   * Send registration rejected email
   */
  async sendRegistrationRejected(
    email: string,
    name: string,
    teamName: string,
    tournamentName: string,
    reason?: string,
  ): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .warning { background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #f44336; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏀 Overtime</h1>
            </div>
            <div class="content">
              <h2>Inscripción Rechazada</h2>
              <p>Hola ${name},</p>
              <p>Lamentamos informarte que tu inscripción no ha sido aprobada.</p>
              
              <div class="warning">
                <strong>Detalles:</strong><br>
                📋 Equipo: ${teamName}<br>
                🏆 Torneo: ${tournamentName}<br>
                ${reason ? `<br>📝 Motivo: ${reason}` : ''}
              </div>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            </div>
            <div class="footer">
              <p>Este email fue enviado por Overtime.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `❌ Inscripción rechazada: ${teamName}`,
      html,
      tags: [
        { name: 'type', value: 'registration_rejected' },
      ],
    });
  }

  /**
   * Send upcoming match reminder
   */
  async sendMatchReminder(
    email: string,
    name: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: Date,
    matchTime: string,
    venue: string,
    venueAddress?: string,
  ): Promise<EmailResult> {
    const dateStr = matchDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .match-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .vs { font-size: 24px; font-weight: bold; color: #666; margin: 10px 0; }
            .team { font-size: 18px; font-weight: bold; }
            .info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏀 Overtime</h1>
            </div>
            <div class="content">
              <h2>Recordatorio de Partido</h2>
              <p>Hola ${name},</p>
              <p>Te recordamos que tienes un partido próximo:</p>
              
              <div class="match-card">
                <div class="team">${homeTeam}</div>
                <div class="vs">VS</div>
                <div class="team">${awayTeam}</div>
              </div>
              
              <div class="info">
                📅 <strong>Fecha:</strong> ${dateStr}<br>
                ⏰ <strong>Hora:</strong> ${matchTime}<br>
                📍 <strong>Cancha:</strong> ${venue}<br>
                ${venueAddress ? `🗺️ <strong>Dirección:</strong> ${venueAddress}` : ''}
              </div>
              
              <p>¡Mucha suerte!</p>
            </div>
            <div class="footer">
              <p>Este email fue enviado por Overtime.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `🏀 Recordatorio: ${homeTeam} vs ${awayTeam} - ${dateStr}`,
      html,
      tags: [
        { name: 'type', value: 'match_reminder' },
      ],
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    email: string,
    name: string,
    amount: number,
    currency: string,
    concept: string,
    paymentId: string,
  ): Promise<EmailResult> {
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .amount { font-size: 32px; font-weight: bold; color: #4CAF50; }
            .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏀 Overtime</h1>
            </div>
            <div class="content">
              <h2>¡Pago Confirmado!</h2>
              <p>Hola ${name},</p>
              
              <div class="success">
                <p style="margin: 0;">✅ Pago recibido</p>
                <div class="amount">${formattedAmount}</div>
              </div>
              
              <div class="details">
                <strong>Detalles del pago:</strong><br>
                📝 Concepto: ${concept}<br>
                🔢 ID de pago: ${paymentId}<br>
                📅 Fecha: ${new Date().toLocaleDateString('es-AR')}
              </div>
              
              <p>Gracias por tu pago. ¡Nos vemos en la cancha!</p>
            </div>
            <div class="footer">
              <p>Este email fue enviado por Overtime. Guarda este comprobante para tus registros.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `✅ Pago confirmado - ${formattedAmount}`,
      html,
      tags: [
        { name: 'type', value: 'payment_confirmation' },
        { name: 'payment_id', value: paymentId },
      ],
    });
  }

  /**
   * Send staff assignment notification
   */
  async sendStaffAssignment(
    email: string,
    name: string,
    role: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: Date,
    matchTime: string,
    venue: string,
  ): Promise<EmailResult> {
    const dateStr = matchDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const roleNames: Record<string, string> = {
      referee: 'Árbitro',
      table_official: 'Oficial de Mesa',
      photographer: 'Fotógrafo',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .assignment { background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800; }
            .info { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .button { display: inline-block; background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏀 Overtime</h1>
            </div>
            <div class="content">
              <h2>Nueva Asignación</h2>
              <p>Hola ${name},</p>
              <p>Has sido asignado/a a un partido:</p>
              
              <div class="assignment">
                <strong>Rol: ${roleNames[role] || role}</strong>
              </div>
              
              <div class="info">
                🏀 <strong>Partido:</strong> ${homeTeam} vs ${awayTeam}<br>
                📅 <strong>Fecha:</strong> ${dateStr}<br>
                ⏰ <strong>Hora:</strong> ${matchTime}<br>
                📍 <strong>Cancha:</strong> ${venue}
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/staff/my-assignments" class="button">Ver mis asignaciones</a>
              </p>
            </div>
            <div class="footer">
              <p>Este email fue enviado por Overtime.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `📋 Nueva asignación: ${roleNames[role] || role} - ${homeTeam} vs ${awayTeam}`,
      html,
      tags: [
        { name: 'type', value: 'staff_assignment' },
        { name: 'role', value: role },
      ],
    });
  }
}
