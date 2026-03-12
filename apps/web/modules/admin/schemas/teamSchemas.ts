import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  sportId: z.string().min(1, 'La disciplina es obligatoria'),
  captainId: z.string().optional(),
})

export const updateTeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio').optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  sportId: z.string().min(1).optional(),
  captainId: z.string().optional(),
})

export const deleteTeamSchema = z.object({ id: z.string().min(1) })

export const addPlayerToTeamSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().min(1, 'Selecciona un jugador'),
})

export const removePlayerFromTeamSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().min(1),
})
