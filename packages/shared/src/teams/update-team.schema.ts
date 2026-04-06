import { z } from 'zod';
import { optionalUrlSchema, optionalUuidSchema } from '../common/zod-helpers';

export const updateTeamSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').optional(),
  logoUrl: optionalUrlSchema,
  sportId: z.string().uuid('La disciplina es invalida').optional(),
  captainId: optionalUuidSchema,
});

export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;
