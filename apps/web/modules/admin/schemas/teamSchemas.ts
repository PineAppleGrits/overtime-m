import { createTeamSchema, updateTeamSchema as updateTeamBodySchema } from '@overtime-mono/shared/teams/contracts'
import { z } from 'zod'

export { createTeamSchema }

export const updateTeamSchema = updateTeamBodySchema.extend({
  id: z.string().min(1),
})

export const deleteTeamSchema = z.object({ id: z.string().min(1) })

export const addPlayerToTeamSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().uuid('Selecciona un jugador valido'),
})

export const removePlayerFromTeamSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().min(1),
})
