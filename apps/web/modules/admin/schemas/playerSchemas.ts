import { z } from 'zod'

export const createPlayerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  jerseyNumber: z.number().int().optional(),
  position: z.string().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  photoUrl: z.string().optional(),
})

export const updatePlayerSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  jerseyNumber: z.number().int().optional(),
  position: z.string().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  photoUrl: z.string().optional(),
})

export const deletePlayerSchema = z.object({
  id: z.string().min(1),
})
