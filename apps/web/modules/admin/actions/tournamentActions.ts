'use server'

import { revalidatePath } from 'next/cache'
import adminTournamentServerService from '@/modules/admin-tournament/AdminTournamentService'
import categoryService from '@/modules/tournament/CategoryService'
import zoneService from '@/modules/tournament/ZoneService'
import {
  createTournamentSchema, updateTournamentSchema, changeStatusSchema,
  deleteTournamentSchema,
  createCategorySchema, updateCategorySchema, deleteCategorySchema,
  createZoneSchema, deleteZoneSchema,
  approveRegistrationTournamentSchema, rejectRegistrationTournamentSchema,
} from '../schemas/tournamentSchemas'
import type { ActionResult } from './types'

export async function createTournamentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createTournamentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    const result = await adminTournamentServerService.createTournament({
      ...parsed.data,
      description: parsed.data.description || undefined,
      registrationStartDate: parsed.data.registrationStartDate || undefined,
      registrationEndDate: parsed.data.registrationEndDate || undefined,
    })
    revalidatePath('/admin/torneos')
    return { success: true, data: { id: result.id } }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo crear el torneo' } }
}

export async function updateTournamentAction(input: unknown): Promise<ActionResult> {
  const parsed = updateTournamentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { id, ...data } = parsed.data
  try {
    await adminTournamentServerService.updateTournament(id, {
      ...data,
      description: data.description || undefined,
      registrationStartDate: data.registrationStartDate || undefined,
      registrationEndDate: data.registrationEndDate || undefined,
    })
    revalidatePath('/admin/torneos')
    revalidatePath(`/admin/torneos/${id}`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo actualizar el torneo' } }
}

export async function changeStatusAction(input: unknown): Promise<ActionResult> {
  const parsed = changeStatusSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await adminTournamentServerService.changeStatus(parsed.data.id, parsed.data.status)
    revalidatePath('/admin/torneos')
    revalidatePath(`/admin/torneos/${parsed.data.id}`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo cambiar el estado' } }
}

export async function deleteTournamentAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteTournamentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await adminTournamentServerService.deleteTournament(parsed.data.id)
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo eliminar el torneo' } }
}

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  const parsed = createCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { tournamentId, ...dto } = parsed.data
  try {
    await categoryService.createCategory(tournamentId, dto)
    revalidatePath(`/admin/torneos/${tournamentId}`)
    revalidatePath(`/admin/torneos/${tournamentId}/categorias`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo crear la categoría' } }
}

export async function updateCategoryAction(input: unknown): Promise<ActionResult> {
  const parsed = updateCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { tournamentId, categoryId, ...dto } = parsed.data
  try {
    await categoryService.updateCategory(tournamentId, categoryId, {
      name: dto.name,
      maxTeams: dto.maxTeams ?? undefined,
      teamsPerZone: dto.teamsPerZone ?? undefined,
    })
    revalidatePath(`/admin/torneos/${tournamentId}`)
    revalidatePath(`/admin/torneos/${tournamentId}/categorias`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo actualizar la categoría' } }
}

export async function deleteCategoryAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await categoryService.deleteCategory(parsed.data.tournamentId, parsed.data.categoryId)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}`)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}/categorias`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo eliminar la categoría' } }
}

export async function createZoneAction(input: unknown): Promise<ActionResult> {
  const parsed = createZoneSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await zoneService.createZone(parsed.data.categoryId, { name: parsed.data.name })
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo crear la zona' } }
}

export async function deleteZoneAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteZoneSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await zoneService.deleteZone(parsed.data.categoryId, parsed.data.zoneId)
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo eliminar la zona' } }
}

export async function approveRegistrationTournamentAction(input: unknown): Promise<ActionResult> {
  const parsed = approveRegistrationTournamentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await adminTournamentServerService.approveRegistration(parsed.data.tournamentId, parsed.data.registrationId)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}/inscripciones`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo aprobar la inscripción' } }
}

export async function rejectRegistrationTournamentAction(input: unknown): Promise<ActionResult> {
  const parsed = rejectRegistrationTournamentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await adminTournamentServerService.rejectRegistration(parsed.data.tournamentId, parsed.data.registrationId, parsed.data.rejectionReason)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}/inscripciones`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo rechazar la inscripción' } }
}
