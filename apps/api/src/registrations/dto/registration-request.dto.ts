import {
  addRegistrationRosterEntrySchema,
  createRegistrationSchema,
} from '@overtime-mono/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateRegistrationBodyDto extends createZodDto(
  createRegistrationSchema,
) {}

export class AddRegistrationRosterEntryBodyDto extends createZodDto(
  addRegistrationRosterEntrySchema,
) {}
