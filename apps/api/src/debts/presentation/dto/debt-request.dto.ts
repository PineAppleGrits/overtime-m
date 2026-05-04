import { createZodDto } from 'nestjs-zod';
import { changeDebtStatusSchema, createDebtSchema } from './debt.zod';

export class CreateDebtBodyDto extends createZodDto(createDebtSchema) {}

export class ChangeDebtStatusBodyDto extends createZodDto(
  changeDebtStatusSchema,
) {}
