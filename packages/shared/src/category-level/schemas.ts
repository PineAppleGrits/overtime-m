import { z } from 'zod';

/**
 * Código de nivel: una letra mayúscula (A, B, C, D...) o cadena alfanumérica corta.
 * Validación liberal por si en el futuro se usan dígitos (ej. 'A1').
 */
export const levelCodeSchema = z
  .string()
  .trim()
  .min(1, 'El código es obligatorio')
  .max(8, 'El código es demasiado largo')
  .regex(/^[A-Z0-9]+$/, 'El código debe ser alfanumérico en mayúsculas');

export const createCategoryLevelSchema = z.object({
  code: levelCodeSchema,
  displayName: z
    .string()
    .trim()
    .min(1, 'El nombre visible es obligatorio')
    .max(60, 'El nombre visible es demasiado largo'),
  rank: z
    .number()
    .int('El rank debe ser entero')
    .min(1, 'El rank mínimo es 1'),
});

export type CreateCategoryLevelDto = z.infer<typeof createCategoryLevelSchema>;

export const updateCategoryLevelSchema = createCategoryLevelSchema.partial();
export type UpdateCategoryLevelDto = z.infer<typeof updateCategoryLevelSchema>;

/**
 * Body para asignar/reemplazar niveles a un equipo.
 * Máximo 2 niveles por equipo (RN-044).
 */
export const categorizeTeamSchema = z.object({
  levelCodes: z
    .array(levelCodeSchema)
    .min(1, 'Debe especificar al menos un nivel')
    .max(2, 'Un equipo puede tener hasta 2 niveles (RN-044)'),
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas son demasiado largas')
    .optional(),
});

export type CategorizeTeamDto = z.infer<typeof categorizeTeamSchema>;
