'use server'

import { revalidatePath } from 'next/cache'
import adminTournamentServerService from '@/modules/admin-tournament/AdminTournamentService'
import categoryService from '@/modules/tournament/CategoryService'
import zoneService from '@/modules/tournament/ZoneService'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import {
  createTournamentSchema, updateTournamentSchema, changeStatusSchema,
  deleteTournamentSchema,
  createCategorySchema, updateCategorySchema, deleteCategorySchema,
  createZoneSchema, deleteZoneSchema,
  assignTeamToZoneSchema, removeTeamFromZoneSchema, moveTeamBetweenZonesSchema,
  approveRegistrationTournamentSchema, rejectRegistrationTournamentSchema,
} from '../schemas/tournamentSchemas'
import type { ActionResult } from './types'
import { requireAuth } from '@/lib/auth/requireAuth'

export async function createTournamentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = createTournamentSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    const result = await adminTournamentServerService.createTournament({
      ...parsed.data,
      description: parsed.data.description || undefined,
      registrationStartDate: parsed.data.registrationStartDate || undefined,
      registrationEndDate: parsed.data.registrationEndDate || undefined,
    })
    revalidatePath('/admin/torneos')
    return { success: true, data: { id: result.id } }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.TOURNAMENT_CREATE_FAILED)
  }
}

export async function updateTournamentAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = updateTournamentSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
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
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.TOURNAMENT_UPDATE_FAILED)
  }
}

export async function changeStatusAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = changeStatusSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await adminTournamentServerService.changeStatus(parsed.data.id, parsed.data.status)
    revalidatePath('/admin/torneos')
    revalidatePath(`/admin/torneos/${parsed.data.id}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.STATUS_CHANGE_FAILED)
  }
}

export async function deleteTournamentAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = deleteTournamentSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await adminTournamentServerService.deleteTournament(parsed.data.id)
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.TOURNAMENT_DELETE_FAILED)
  }
}

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = createCategorySchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  const { tournamentId, ...dto } = parsed.data
  try {
    await categoryService.createCategory(tournamentId, dto)
    revalidatePath(`/admin/torneos/${tournamentId}`)
    revalidatePath(`/admin/torneos/${tournamentId}/categorias`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.CATEGORY_CREATE_FAILED)
  }
}

export async function updateCategoryAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = updateCategorySchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
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
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.CATEGORY_UPDATE_FAILED)
  }
}

export async function deleteCategoryAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = deleteCategorySchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await categoryService.deleteCategory(parsed.data.tournamentId, parsed.data.categoryId)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}`)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}/categorias`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.CATEGORY_DELETE_FAILED)
  }
}

export async function createZoneAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = createZoneSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await zoneService.createZone(parsed.data.categoryId, { name: parsed.data.name })
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.ZONE_CREATE_FAILED)
  }
}

export async function deleteZoneAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = deleteZoneSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await zoneService.deleteZone(parsed.data.categoryId, parsed.data.zoneId)
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.ZONE_DELETE_FAILED)
  }
}

export async function assignTeamToZoneAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = assignTeamToZoneSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await zoneService.assignTeam(parsed.data.categoryId, parsed.data.zoneId, { teamId: parsed.data.teamId })
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.ZONE_TEAM_ASSIGN_FAILED)
  }
}

export async function removeTeamFromZoneAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = removeTeamFromZoneSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await zoneService.removeTeam(parsed.data.categoryId, parsed.data.zoneId, parsed.data.teamId)
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.ZONE_TEAM_REMOVE_FAILED)
  }
}

export async function moveTeamBetweenZonesAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = moveTeamBetweenZonesSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  const { categoryId, fromZoneId, toZoneId, teamId } = parsed.data
  if (fromZoneId === toZoneId) return { success: true }
  try {
    await zoneService.removeTeam(categoryId, fromZoneId, teamId)
    await zoneService.assignTeam(categoryId, toZoneId, { teamId })
    revalidatePath('/admin/torneos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.ZONE_TEAM_MOVE_FAILED)
  }
}

export async function approveRegistrationTournamentAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = approveRegistrationTournamentSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await adminTournamentServerService.approveRegistration(parsed.data.tournamentId, parsed.data.registrationId)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}/inscripciones`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.REGISTRATION_APPROVE_FAILED)
  }
}

export async function rejectRegistrationTournamentAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = rejectRegistrationTournamentSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await adminTournamentServerService.rejectRegistration(parsed.data.tournamentId, parsed.data.registrationId, parsed.data.rejectionReason)
    revalidatePath(`/admin/torneos/${parsed.data.tournamentId}/inscripciones`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.REGISTRATION_REJECT_FAILED)
  }
}
