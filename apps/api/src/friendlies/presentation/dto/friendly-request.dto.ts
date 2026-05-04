import { createZodDto } from 'nestjs-zod';
import {
  cancelFriendlySchema,
  generateFriendlySchema,
  requestFriendlySchema,
} from './friendly.zod';

export class RequestFriendlyBodyDto extends createZodDto(
  requestFriendlySchema,
) {}

export class GenerateFriendlyBodyDto extends createZodDto(
  generateFriendlySchema,
) {}

export class CancelFriendlyBodyDto extends createZodDto(cancelFriendlySchema) {}
