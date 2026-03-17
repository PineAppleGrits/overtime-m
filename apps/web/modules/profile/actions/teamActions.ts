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
