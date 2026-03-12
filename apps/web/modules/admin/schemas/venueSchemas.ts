import { z } from 'zod'

export const createVenueSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  googleMapsUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  capacity: z.number().int().positive('La capacidad debe ser mayor a 0').optional(),
  isActive: z.boolean().optional(),
})

export const updateVenueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio'),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  googleMapsUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  capacity: z.number().int().positive('La capacidad debe ser mayor a 0').optional(),
  isActive: z.boolean().optional(),
})

export const deleteVenueSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
})

export type CreateVenueInput = z.infer<typeof createVenueSchema>
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>
