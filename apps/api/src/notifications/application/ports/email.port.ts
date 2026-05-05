/**
 * Puerto de envío de emails. Aísla la application layer de la
 * infraestructura concreta (Resend, Mailgun, mock, etc).
 */
export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface IEmailPort {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

export const EMAIL_PORT = Symbol('EMAIL_PORT');
