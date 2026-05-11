'use server'

import { revalidatePath } from 'next/cache'
import myMatchesService from '../services/MyMatchesService'
import { updateMatchScoreSchema, changeMatchStatusSchema } from '../schemas/matchSchemas'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import { requireAuth } from '@/lib/auth/requireAuth'

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
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const parsed = updateMatchScoreSchema.safeParse(input)

  if (!parsed.success) {
    return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  }

  const { matchId, homeScore, awayScore } = parsed.data

  try {
    await myMatchesService.updateMatchScore(matchId, { homeScore, awayScore })
    revalidatePath('/admin/mis-partidos')
    return { success: true }
  } catch (error) {
    console.error('Error updating match score:', error)
    return actionFailure(ErrorCode.MATCH_SCORE_UPDATE_FAILED)
  }
}

/**
 * Server action: Change the status of a match.
 * Validates input with Zod before calling the API.
 */
export async function changeMatchStatusAction(
  input: unknown
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const parsed = changeMatchStatusSchema.safeParse(input)

  if (!parsed.success) {
    return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  }

  const { matchId, status } = parsed.data

  try {
    await myMatchesService.changeMatchStatus(matchId, { status })
    revalidatePath('/admin/mis-partidos')
    return { success: true }
  } catch (error) {
    console.error('Error changing match status:', error)
    return actionFailure(ErrorCode.MATCH_STATUS_CHANGE_FAILED)
  }
}
