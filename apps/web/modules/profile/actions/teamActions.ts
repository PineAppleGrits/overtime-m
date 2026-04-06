'use server'

import { revalidatePath } from 'next/cache'
import { createTeamSchema } from '@overtime-mono/shared/teams/contracts'
import { z } from 'zod'
import teamService from '@/modules/team/TeamService'
import { getProfile } from '@/lib/auth/session'
import type { ActionResult } from '@/modules/admin/actions/types'
import { normalizeTeamPayload } from '@/modules/team/team-payload'

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
  const parsed = createTeamSchema.safeParse(input)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos invÃ¡lidos' }

  try {
    const team = await teamService.createTeam(normalizeTeamPayload(parsed.data))
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
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos invÃ¡lidos' }

  try {
    const franchise = await teamService.createFranchise({ name: parsed.data.franchiseName })
    const franchiseId: string = franchise?.id ?? franchise?.data?.id

    const team = await teamService.createTeam(
      normalizeTeamPayload({
        name: parsed.data.teamName,
        sportId: parsed.data.sportId,
        franchiseId,
      }),
    )
    const teamId: string = team?.id ?? team?.data?.id

    revalidatePath('/profile/equipos')
    return { success: true, data: { teamId, franchiseId } }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo crear la franquicia' }
  }
}
