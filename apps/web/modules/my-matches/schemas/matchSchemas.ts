import { z } from 'zod'

/**
 * Zod schemas for validating match-related server action inputs.
 */

const MATCH_STATUSES = [
  'programado',
  'en_curso',
  'suspendido',
  'cancelado',
  'reprogramado',
  'finalizado',
] as const

export const updateMatchScoreSchema = z.object({
  matchId: z.string().min(1, 'El ID del partido es requerido'),
  homeScore: z
    .number()
    .int('El puntaje debe ser un número entero')
    .min(0, 'El puntaje no puede ser negativo'),
  awayScore: z
    .number()
    .int('El puntaje debe ser un número entero')
    .min(0, 'El puntaje no puede ser negativo'),
})

export const changeMatchStatusSchema = z.object({
  matchId: z.string().min(1, 'El ID del partido es requerido'),
  status: z.enum(MATCH_STATUSES, {
    message: 'Estado de partido inválido',
  }),
})

export type UpdateMatchScoreSchema = z.infer<typeof updateMatchScoreSchema>
export type ChangeMatchStatusSchema = z.infer<typeof changeMatchStatusSchema>
