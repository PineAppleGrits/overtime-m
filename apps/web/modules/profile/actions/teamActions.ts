'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import teamService from '@/modules/team/TeamService'
import { getProfile } from '@/lib/auth/session'
import type { ActionResult } from '@/modules/admin/actions/types'

const createUserTeamSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  sportId: z.string().min(1, 'La disciplina es obligatoria'),
  franchiseId: z.string().uuid().optional(),
})

const createFranchiseSchema = z.object({
  franchiseName: z.string().min(1, 'El nombre de la franquicia es obligatorio'),
  teamName: z.string().min(1, 'El nombre del equipo es obligatorio'),
  sportId: z.string().min(1, 'La disciplina es obligatoria'),
})

export async function leaveTeamAction(teamId: string): Promise<ActionResult<void>> {
  const profile = await getProfile()
  if (!profile) return { success: false, error: 'No autenticado' }

  try {
    await teamService.removePlayer(teamId, profile.id)
    revalidatePath('/profile/equipos')
    revalidatePath(`/equipos/${teamId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo abandonar el equipo' }
  }
}

export async function createUserTeamAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createUserTeamSchema.safeParse(input)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const dto = { ...parsed.data, logoUrl: parsed.data.logoUrl || undefined }
    const team = await teamService.createTeam(dto)
    const id: string = team?.id ?? team?.data?.id
    revalidatePath('/profile/equipos')
    return { success: true, data: { id } }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo crear el equipo' }
  }
}

export async function removePlayerFromTeamAction(
  teamId: string,
  profileId: string,
): Promise<ActionResult<void>> {
  const uuidSchema = z.string().uuid()
  const teamIdParsed = uuidSchema.safeParse(teamId)
  const profileIdParsed = uuidSchema.safeParse(profileId)

  if (!teamIdParsed.success || !profileIdParsed.success) {
    return { success: false, error: 'IDs inválidos' }
  }

  try {
    await teamService.removePlayer(teamId, profileId)
    revalidatePath(`/equipos/${teamId}`)
    revalidatePath('/profile/equipos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo quitar al jugador del equipo' }
  }
}

export async function addPlayerToTeamAction(
  teamId: string,
  profileId: string,
): Promise<ActionResult<void>> {
  const uuidSchema = z.string().uuid()
  const teamIdParsed = uuidSchema.safeParse(teamId)
  const profileIdParsed = uuidSchema.safeParse(profileId)

  if (!teamIdParsed.success || !profileIdParsed.success) {
    return { success: false, error: 'IDs inválidos' }
  }

  try {
    await teamService.addPlayer(teamId, { playerId: profileId })
    revalidatePath(`/equipos/${teamId}`)
    revalidatePath('/profile/equipos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo agregar al jugador' }
  }
}

const updateTeamNameSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
})

export async function updateTeamNameAction(
  teamId: string,
  input: unknown,
): Promise<ActionResult<void>> {
  const uuidSchema = z.string().uuid()
  const teamIdParsed = uuidSchema.safeParse(teamId)
  if (!teamIdParsed.success) {
    return { success: false, error: 'ID de equipo inválido' }
  }

  const parsed = updateTeamNameSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await teamService.updateTeam(teamId, { name: parsed.data.name })
    revalidatePath(`/equipos/${teamId}`)
    revalidatePath('/profile/equipos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo actualizar el nombre del equipo' }
  }
}

export async function deleteTeamAction(
  teamId: string,
): Promise<ActionResult<void>> {
  const uuidSchema = z.string().uuid()
  const teamIdParsed = uuidSchema.safeParse(teamId)
  if (!teamIdParsed.success) {
    return { success: false, error: 'ID de equipo inválido' }
  }

  try {
    await teamService.deleteTeam(teamId)
    revalidatePath('/profile/equipos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo eliminar el equipo' }
  }
}

export async function createFranchiseWithTeamAction(
  input: unknown,
): Promise<ActionResult<{ teamId: string; franchiseId: string }>> {
  const parsed = createFranchiseSchema.safeParse(input)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const franchise = await teamService.createFranchise({ name: parsed.data.franchiseName })
    const franchiseId: string = franchise?.id ?? franchise?.data?.id

    const team = await teamService.createTeam({
      name: parsed.data.teamName,
      sportId: parsed.data.sportId,
      franchiseId,
    })
    const teamId: string = team?.id ?? team?.data?.id

    revalidatePath('/profile/equipos')
    return { success: true, data: { teamId, franchiseId } }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo crear la franquicia' }
  }
}
