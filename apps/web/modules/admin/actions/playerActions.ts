'use server'

import { revalidatePath } from 'next/cache'
import playerService from '@/modules/player/PlayerService'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import { createPlayerSchema, updatePlayerSchema, deletePlayerSchema } from '../schemas/playerSchemas'
import type { ActionResult } from './types'

export async function createPlayerAction(input: unknown): Promise<ActionResult> {
  const parsed = createPlayerSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await playerService.createPlayer(parsed.data)
    revalidatePath('/admin/jugadores')
    return { success: true }
  } catch (error) {
    console.error('Error creating player:', error)
    return actionFailure(ErrorCode.PLAYER_CREATE_FAILED)
  }
}

export async function updatePlayerAction(input: unknown): Promise<ActionResult> {
  const parsed = updatePlayerSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  const { id, ...data } = parsed.data
  try {
    await playerService.updatePlayer(id, data)
    revalidatePath('/admin/jugadores')
    return { success: true }
  } catch (error) {
    console.error('Error updating player:', error)
    return actionFailure(ErrorCode.PLAYER_UPDATE_FAILED)
  }
}

export async function deletePlayerAction(input: unknown): Promise<ActionResult> {
  const parsed = deletePlayerSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await playerService.deletePlayer(parsed.data.id)
    revalidatePath('/admin/jugadores')
    return { success: true }
  } catch (error) {
    console.error('Error deleting player:', error)
    return actionFailure(ErrorCode.PLAYER_DELETE_FAILED)
  }
}
