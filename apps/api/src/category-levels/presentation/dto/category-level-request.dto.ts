import {
  createCategoryLevelSchema,
  updateCategoryLevelSchema,
} from '@overtime-mono/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateCategoryLevelBodyDto extends createZodDto(
  createCategoryLevelSchema,
) {}

export class UpdateCategoryLevelBodyDto extends createZodDto(
  updateCategoryLevelSchema,
) {}
