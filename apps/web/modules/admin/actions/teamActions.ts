'use server'

import { revalidatePath } from 'next/cache'
import teamService from '@/modules/team/TeamService'
import { createTeamSchema, updateTeamSchema, deleteTeamSchema, addPlayerToTeamSchema, removePlayerFromTeamSchema } from '../schemas/teamSchemas'
import type { ActionResult } from './types'

export async function createTeamAction(input: unknown): Promise<ActionResult> {
  const parsed = createTeamSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    const dto = { ...parsed.data, logoUrl: parsed.data.logoUrl || undefined }
    await teamService.createTeam(dto)
    revalidatePath('/admin/equipos')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo crear el equipo' } }
}

export async function updateTeamAction(input: unknown): Promise<ActionResult> {
  const parsed = updateTeamSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { id, ...data } = parsed.data
  try {
    const dto = { ...data, logoUrl: data.logoUrl || undefined }
    await teamService.updateTeam(id, dto)
    revalidatePath('/admin/equipos')
    revalidatePath(`/admin/equipos/${id}`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo actualizar el equipo' } }
}

export async function deleteTeamAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteTeamSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await teamService.deleteTeam(parsed.data.id)
    revalidatePath('/admin/equipos')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo eliminar el equipo' } }
}

export async function addPlayerToTeamAction(input: unknown): Promise<ActionResult> {
  const parsed = addPlayerToTeamSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await teamService.addPlayer(parsed.data.teamId, { playerId: parsed.data.playerId })
    revalidatePath(`/admin/equipos/${parsed.data.teamId}`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo agregar el jugador' } }
}

export async function removePlayerFromTeamAction(input: unknown): Promise<ActionResult> {
  const parsed = removePlayerFromTeamSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await teamService.removePlayer(parsed.data.teamId, parsed.data.playerId)
    revalidatePath(`/admin/equipos/${parsed.data.teamId}`)
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo remover el jugador' } }
}
