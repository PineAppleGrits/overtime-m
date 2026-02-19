import { PipeTransform, Type } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

export function UseZodValidation(schema: ZodSchema) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const pipe = new ZodValidationPipe(schema);

    descriptor.value = async function (...args: any[]) {
      // Apply validation to body (usually the first parameter after request)
      const metadata = { type: 'body' as const, metatype: undefined, data: '' };
      if (args.length > 0 && typeof args[0] === 'object') {
        args[0] = await pipe.transform(args[0], metadata);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
