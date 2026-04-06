import { createFranchiseSchema } from '@overtime-mono/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateFranchiseBodyDto extends createZodDto(
  createFranchiseSchema,
) {}
