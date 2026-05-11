'use server'

import { revalidatePath } from 'next/cache'
import sportService from '@/modules/sport/SportService'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import {
  createSportSchema,
  updateSportSchema,
  deleteSportSchema,
} from '../schemas/sportSchemas'
import type { ActionResult } from './types'
import { requireAuth } from '@/lib/auth/requireAuth'

export async function createSportAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = createSportSchema.safeParse(input)
  if (!parsed.success) {
    return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  }
  try {
    await sportService.createSport(parsed.data)
    revalidatePath('/admin/disciplinas')
    return { success: true }
  } catch (error) {
    console.error('Error creating sport:', error)
    return actionFailure(ErrorCode.SPORT_CREATE_FAILED)
  }
}

export async function updateSportAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = updateSportSchema.safeParse(input)
  if (!parsed.success) {
    return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  }
  const { id, ...data } = parsed.data
  try {
    await sportService.updateSport(id, data)
    revalidatePath('/admin/disciplinas')
    return { success: true }
  } catch (error) {
    console.error('Error updating sport:', error)
    return actionFailure(ErrorCode.SPORT_UPDATE_FAILED)
  }
}

export async function deleteSportAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = deleteSportSchema.safeParse(input)
  if (!parsed.success) {
    return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  }
  try {
    await sportService.deleteSport(parsed.data.id)
    revalidatePath('/admin/disciplinas')
    return { success: true }
  } catch (error) {
    console.error('Error deleting sport:', error)
    return actionFailure(ErrorCode.SPORT_DELETE_FAILED)
  }
}
