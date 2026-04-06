import {
  addPlayerSchema,
  createTeamSchema,
  updateTeamSchema,
} from '@overtime-mono/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateTeamBodyDto extends createZodDto(createTeamSchema) {}

export class UpdateTeamBodyDto extends createZodDto(updateTeamSchema) {}

export class AddPlayerBodyDto extends createZodDto(addPlayerSchema) {}
