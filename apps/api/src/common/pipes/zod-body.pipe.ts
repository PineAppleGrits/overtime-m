import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * Pipe to validate request body with Zod schema
 * Usage: @Body(ZodBodyPipe(createTeamSchema))
 */
export function ZodBodyPipe(schema: ZodSchema) {
  @Injectable()
  class ZodBodyPipeClass implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
      try {
        return schema.parse(value);
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          const errors = error.issues.map((err) => ({
            property: err.path.join('.'),
            message: err.message,
            code: err.code,
          }));

          throw new BadRequestException({
            message: 'Validation failed',
            errors,
          });
        }
        throw error;
      }
    }
  }
  return ZodBodyPipeClass;
}
