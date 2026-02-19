import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to skip rate limiting for specific endpoints
 */
export const SkipThrottle = () => SetMetadata('skipThrottle', true);
