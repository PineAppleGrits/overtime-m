import { categorizeTeamSchema } from '@overtime-mono/shared';
import { createZodDto } from 'nestjs-zod';

export class CategorizeTeamBodyDto extends createZodDto(categorizeTeamSchema) {}
