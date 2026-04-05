import {
  createTournamentSchema,
  updateTournamentSchema,
} from '@overtime-mono/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateTournamentBodyDto extends createZodDto(
  createTournamentSchema,
) {}

export class UpdateTournamentBodyDto extends createZodDto(
  updateTournamentSchema,
) {}
