import { registerAs } from '@nestjs/config';

export default registerAs('mercadopago', () => ({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  successUrl: process.env.MERCADOPAGO_SUCCESS_URL || 'http://localhost:3001/payments/success',
  failureUrl: process.env.MERCADOPAGO_FAILURE_URL || 'http://localhost:3001/payments/failure',
  pendingUrl: process.env.MERCADOPAGO_PENDING_URL || 'http://localhost:3001/payments/pending',
  notificationUrl: process.env.MERCADOPAGO_NOTIFICATION_URL,
  enabled: process.env.MERCADOPAGO_ENABLED === 'true',
}));
