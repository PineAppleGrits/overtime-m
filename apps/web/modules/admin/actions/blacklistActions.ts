'use server'

import { revalidatePath } from 'next/cache'
import blacklistService from '@/modules/blacklist/BlacklistService'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import { createBlacklistSchema, toggleBlacklistSchema, deleteBlacklistSchema } from '../schemas/blacklistSchemas'
import type { ActionResult } from './types'
import { requireAuth } from '@/lib/auth/requireAuth'

export async function createBlacklistAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = createBlacklistSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await blacklistService.createEntry(parsed.data)
    revalidatePath('/admin/jugadores/lista-negra')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.BLACKLIST_ADD_FAILED)
  }
}

export async function toggleBlacklistAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = toggleBlacklistSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await blacklistService.updateEntry(parsed.data.id, { isActive: parsed.data.isActive })
    revalidatePath('/admin/jugadores/lista-negra')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.STATUS_CHANGE_FAILED)
  }
}

export async function deleteBlacklistAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = deleteBlacklistSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await blacklistService.deleteEntry(parsed.data.id)
    revalidatePath('/admin/jugadores/lista-negra')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.BLACKLIST_REMOVE_FAILED)
  }
}

export async function checkPlayerAction(dni: string): Promise<{ success: boolean; data?: { isBlacklisted: boolean; reason: string | null }; error?: string }> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  try {
    const response = await blacklistService.checkPlayer(dni)
    return {
      success: true,
      data: {
        isBlacklisted: response.data?.isBlacklisted ?? false,
        reason: response.data?.reason ?? null,
      },
    }
  } catch (error) {
    console.error('Error checking player blacklist status:', error)
    return actionFailure(ErrorCode.BLACKLIST_CHECK_FAILED)
  }
}
