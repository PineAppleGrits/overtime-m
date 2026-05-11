'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import playerStatsService from '@/modules/match/PlayerStatsService'
import type { ActionResult } from './types'
import { requireAuth } from '@/lib/auth/requireAuth'

const nonNegInt = z.number().int().min(0).optional()

const matchPlayerStatEntrySchema = z.object({
  profileId: z.string().uuid(),
  teamId: z.string().uuid(),
  pt1: nonNegInt,
  pt1Att: nonNegInt,
  pt2: nonNegInt,
  pt2Att: nonNegInt,
  pt3: nonNegInt,
  pt3Att: nonNegInt,
  fouls: nonNegInt,
  steals: nonNegInt,
  rebounds: nonNegInt,
  assists: nonNegInt,
  turnovers: nonNegInt,
  blocks: nonNegInt,
})

const upsertSchema = z.object({
  matchId: z.string().uuid(),
  stats: z.array(matchPlayerStatEntrySchema).min(1),
})

/**
 * Bulk upsert de stats individuales de un partido. Llama al endpoint BE
 * `POST /matches/:matchId/player-stats`. Solo admin/master/oficial de mesa
 * tienen permiso (validado server-side por el BE).
 */
export async function upsertMatchPlayerStatsAction(
  input: unknown,
): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = upsertSchema.safeParse(input)
  if (!parsed.success) {
    return actionFailure(
      ErrorCode.INVALID_INPUT,
      parsed.error.issues[0]?.message,
    )
  }

  try {
    await playerStatsService.upsertForMatch(parsed.data.matchId, parsed.data.stats)
    revalidatePath(`/admin/torneos`)
    revalidatePath(`/admin/torneos/[id]/partidos/[matchId]`, 'page')
    return { success: true }
  } catch (error) {
    console.error('Error upserting match player stats:', error)
    return actionFailure(ErrorCode.MATCH_STATS_UPSERT_FAILED)
  }
}
