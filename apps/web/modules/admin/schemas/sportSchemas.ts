import { z } from 'zod'

export const createSportSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  code: z.string().min(1, 'El código es obligatorio'),
  description: z.string().optional(),
})

export const updateSportSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio'),
  code: z.string().min(1, 'El código es obligatorio'),
  description: z.string().optional(),
})

export const deleteSportSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
})

export type CreateSportInput = z.infer<typeof createSportSchema>
export type UpdateSportInput = z.infer<typeof updateSportSchema>
