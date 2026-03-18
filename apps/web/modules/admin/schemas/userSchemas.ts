import { z } from 'zod'

const profileRoles = ['master', 'admin', 'player', 'photographer', 'referee', 'official'] as const

export const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  documentNumber: z.string().max(20).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  role: z.enum(profileRoles).optional(),
})

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  documentNumber: z.string().max(20).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  role: z.enum(profileRoles).optional(),
})

export const deleteUserSchema = z.object({ id: z.string().min(1) })
