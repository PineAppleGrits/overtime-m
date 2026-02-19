import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Decorator to validate request body with Zod schema
 * Usage: @ZodBody(createTeamSchema)
 */
export const ZodBody = (schema: ZodSchema) => {
  const pipe = new ZodValidationPipe(schema);
  return createParamDecorator(async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return pipe.transform(request.body, {
      type: 'body',
      metatype: undefined,
      data: '',
    });
  })();
};
