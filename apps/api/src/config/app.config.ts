import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10), // Time window in seconds
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // Max requests per window
  },
}));
