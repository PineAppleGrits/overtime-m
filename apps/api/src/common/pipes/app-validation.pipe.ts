import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

type ZodDtoLike = {
  isZodDto: true;
  schema: unknown;
};

const isZodDtoMetatype = (metatype: unknown): metatype is ZodDtoLike => {
  return (
    typeof metatype === 'function' &&
    'isZodDto' in metatype &&
    'schema' in metatype
  );
};

@Injectable()
export class AppValidationPipe implements PipeTransform<unknown> {
  private readonly zodValidationPipe = new ZodValidationPipe();

  private readonly legacyValidationPipe = new NestValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  });

  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    if (isZodDtoMetatype(metadata.metatype)) {
      return this.zodValidationPipe.transform(value, metadata);
    }

    return this.legacyValidationPipe.transform(value, metadata);
  }
}
