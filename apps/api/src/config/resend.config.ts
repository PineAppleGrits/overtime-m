import { registerAs } from '@nestjs/config';

export default registerAs('resend', () => ({
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL || 'Overtime <noreply@overtime.com>',
  replyToEmail: process.env.RESEND_REPLY_TO || 'soporte@overtime.com',
  enabled: process.env.RESEND_ENABLED === 'true',
}));
