import { createZodDto } from 'nestjs-zod';
import {
  assignRoleSchema,
  preCreateAccountSchema,
  verifyDniSchema,
} from './users.zod';

export class VerifyDniBodyDto extends createZodDto(verifyDniSchema) {}
export class AssignRoleBodyDto extends createZodDto(assignRoleSchema) {}
export class PreCreateAccountBodyDto extends createZodDto(preCreateAccountSchema) {}
