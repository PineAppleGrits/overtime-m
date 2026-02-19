'use server'

import { revalidatePath } from 'next/cache'
import myMatchesService from '../services/MyMatchesService'
import { updateMatchScoreSchema, changeMatchStatusSchema } from '../schemas/matchSchemas'

interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Server action: Update the score of a match.
 * Validates input with Zod before calling the API.
 */
export async function updateMatchScoreAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = updateMatchScoreSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError }
  }

  const { matchId, homeScore, awayScore } = parsed.data

  try {
    await myMatchesService.updateMatchScore(matchId, { homeScore, awayScore })
    revalidatePath('/admin/mis-partidos')
    return { success: true }
  } catch (error) {
    console.error('Error updating match score:', error)
    return { success: false, error: 'No se pudo actualizar el marcador' }
  }
}

/**
 * Server action: Change the status of a match.
 * Validates input with Zod before calling the API.
 */
export async function changeMatchStatusAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = changeMatchStatusSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError }
  }

  const { matchId, status } = parsed.data

  try {
    await myMatchesService.changeMatchStatus(matchId, { status })
    revalidatePath('/admin/mis-partidos')
    return { success: true }
  } catch (error) {
    console.error('Error changing match status:', error)
    return { success: false, error: 'No se pudo cambiar el estado del partido' }
  }
}
