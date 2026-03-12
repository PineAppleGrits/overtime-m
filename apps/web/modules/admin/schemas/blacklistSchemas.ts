import { z } from 'zod'

export const createBlacklistSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  documentNumber: z.string().min(1, 'El DNI es obligatorio'),
  reason: z.string().min(1, 'El motivo es obligatorio'),
})

export const toggleBlacklistSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
})

export const deleteBlacklistSchema = z.object({ id: z.string().min(1) })
