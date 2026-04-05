import { z } from 'zod';
import { optionalUrlSchema, optionalUuidSchema } from '../common/zod-helpers';

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  logoUrl: optionalUrlSchema,
  sportId: z.string().uuid('La disciplina es invalida'),
  captainId: optionalUuidSchema,
  franchiseId: optionalUuidSchema,
});

export type CreateTeamDto = z.infer<typeof createTeamSchema>;
