'use server'

import { revalidatePath } from 'next/cache'
import playerService from '@/modules/player/PlayerService'
import { createPlayerSchema, updatePlayerSchema, deletePlayerSchema } from '../schemas/playerSchemas'
import type { ActionResult } from './types'

export async function createPlayerAction(input: unknown): Promise<ActionResult> {
  const parsed = createPlayerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await playerService.createPlayer(parsed.data)
    revalidatePath('/admin/jugadores')
    return { success: true }
  } catch (error) {
    console.error('Error creating player:', error)
    return { success: false, error: 'No se pudo crear el jugador' }
  }
}

export async function updatePlayerAction(input: unknown): Promise<ActionResult> {
  const parsed = updatePlayerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { id, ...data } = parsed.data
  try {
    await playerService.updatePlayer(id, data)
    revalidatePath('/admin/jugadores')
    return { success: true }
  } catch (error) {
    console.error('Error updating player:', error)
    return { success: false, error: 'No se pudo actualizar el jugador' }
  }
}

export async function deletePlayerAction(input: unknown): Promise<ActionResult> {
  const parsed = deletePlayerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await playerService.deletePlayer(parsed.data.id)
    revalidatePath('/admin/jugadores')
    return { success: true }
  } catch (error) {
    console.error('Error deleting player:', error)
    return { success: false, error: 'No se pudo eliminar el jugador' }
  }
}
