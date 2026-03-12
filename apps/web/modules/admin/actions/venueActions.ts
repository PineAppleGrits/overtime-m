'use server'

import { revalidatePath } from 'next/cache'
import venueService from '@/modules/venue/VenueService'
import {
  createVenueSchema,
  updateVenueSchema,
  deleteVenueSchema,
} from '../schemas/venueSchemas'
import type { ActionResult } from './types'

export async function createVenueAction(input: unknown): Promise<ActionResult> {
  const parsed = createVenueSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  try {
    const dto = {
      ...parsed.data,
      googleMapsUrl: parsed.data.googleMapsUrl || undefined,
    }
    await venueService.createVenue(dto)
    revalidatePath('/admin/canchas')
    return { success: true }
  } catch (error) {
    console.error('Error creating venue:', error)
    return { success: false, error: 'No se pudo crear la cancha' }
  }
}

export async function updateVenueAction(input: unknown): Promise<ActionResult> {
  const parsed = updateVenueSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const { id, ...data } = parsed.data
  try {
    const dto = {
      ...data,
      googleMapsUrl: data.googleMapsUrl || undefined,
    }
    await venueService.updateVenue(id, dto)
    revalidatePath('/admin/canchas')
    return { success: true }
  } catch (error) {
    console.error('Error updating venue:', error)
    return { success: false, error: 'No se pudo actualizar la cancha' }
  }
}

export async function deleteVenueAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteVenueSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  try {
    await venueService.deleteVenue(parsed.data.id)
    revalidatePath('/admin/canchas')
    return { success: true }
  } catch (error) {
    console.error('Error deleting venue:', error)
    return { success: false, error: 'No se pudo eliminar la cancha' }
  }
}
