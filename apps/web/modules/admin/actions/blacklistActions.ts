'use server'

import { revalidatePath } from 'next/cache'
import blacklistService from '@/modules/blacklist/BlacklistService'
import { createBlacklistSchema, toggleBlacklistSchema, deleteBlacklistSchema } from '../schemas/blacklistSchemas'
import type { ActionResult } from './types'

export async function createBlacklistAction(input: unknown): Promise<ActionResult> {
  const parsed = createBlacklistSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await blacklistService.createEntry(parsed.data)
    revalidatePath('/admin/jugadores/lista-negra')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo agregar a la lista negra' } }
}

export async function toggleBlacklistAction(input: unknown): Promise<ActionResult> {
  const parsed = toggleBlacklistSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await blacklistService.updateEntry(parsed.data.id, { isActive: parsed.data.isActive })
    revalidatePath('/admin/jugadores/lista-negra')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo cambiar el estado' } }
}

export async function deleteBlacklistAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteBlacklistSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await blacklistService.deleteEntry(parsed.data.id)
    revalidatePath('/admin/jugadores/lista-negra')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo eliminar de la lista negra' } }
}

export async function checkPlayerAction(dni: string): Promise<{ success: boolean; data?: { isBlacklisted: boolean; reason: string | null }; error?: string }> {
  try {
    const response = await blacklistService.checkPlayer(dni);
    return { 
      success: true, 
      data: {
        isBlacklisted: response.data?.isBlacklisted ?? false,
        reason: response.data?.reason ?? null
      }
    };
  } catch (error) {
    console.error('Error checking player blacklist status:', error);
    return { success: false, error: 'Error verificando estado del jugador' };
  }
}
