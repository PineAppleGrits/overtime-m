'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import matchService from '@/modules/match/MatchService'
import type { ActionResult } from './types'

export async function rescheduleMatchAction(
  matchId: string,
  newDate: string,
): Promise<ActionResult<void>> {
  const idSchema = z.string().uuid()
  const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')

  if (!idSchema.safeParse(matchId).success) return { success: false, error: 'ID inválido' }
  if (!dateSchema.safeParse(newDate).success) return { success: false, error: 'Fecha inválida' }

  try {
    await matchService.updateMatch(matchId, { matchDate: newDate })
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reprogramar el partido' }
  }
}

const createMatchSchema = z.object({
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  matchTime: z.string().optional(),
  venueId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  matchType: z.enum(['regular', 'amistoso']).optional(),
})

export async function createMatchAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createMatchSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    const match = await matchService.createMatch(parsed.data)
    revalidatePath('/admin/torneos')
    return { success: true, data: { id: match?.id ?? match?.data?.id } }
  } catch {
    return { success: false, error: 'No se pudo crear el partido' }
  }
}

export async function updateMatchStatusAction(
  matchId: string,
  status: 'programado' | 'en_curso' | 'suspendido' | 'cancelado' | 'reprogramado' | 'finalizado',
): Promise<ActionResult<void>> {
  if (!z.string().uuid().safeParse(matchId).success) return { success: false, error: 'ID inválido' }

  try {
    await matchService.changeMatchStatus(matchId, { status })
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo cambiar el estado' }
  }
}
