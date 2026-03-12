'use server'

import { revalidatePath } from 'next/cache'
import sportService from '@/modules/sport/SportService'
import {
  createSportSchema,
  updateSportSchema,
  deleteSportSchema,
} from '../schemas/sportSchemas'
import type { ActionResult } from './types'

export async function createSportAction(input: unknown): Promise<ActionResult> {
  const parsed = createSportSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  try {
    await sportService.createSport(parsed.data)
    revalidatePath('/admin/disciplinas')
    return { success: true }
  } catch (error) {
    console.error('Error creating sport:', error)
    return { success: false, error: 'No se pudo crear la disciplina' }
  }
}

export async function updateSportAction(input: unknown): Promise<ActionResult> {
  const parsed = updateSportSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const { id, ...data } = parsed.data
  try {
    await sportService.updateSport(id, data)
    revalidatePath('/admin/disciplinas')
    return { success: true }
  } catch (error) {
    console.error('Error updating sport:', error)
    return { success: false, error: 'No se pudo actualizar la disciplina' }
  }
}

export async function deleteSportAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteSportSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  try {
    await sportService.deleteSport(parsed.data.id)
    revalidatePath('/admin/disciplinas')
    return { success: true }
  } catch (error) {
    console.error('Error deleting sport:', error)
    return { success: false, error: 'No se pudo eliminar la disciplina' }
  }
}
