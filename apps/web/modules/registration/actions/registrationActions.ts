'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import registrationService from '@/modules/registration/RegistrationService'
import teamService from '@/modules/team/TeamService'
import type { ActionResult } from '@/modules/admin/actions/types'

const MIN_ROSTER_SIZE = 8

const createRegistrationSchema = z.object({
  teamId: z.string().uuid('El equipo es inválido'),
  tournamentId: z.string().uuid('El torneo es inválido'),
  categoryId: z.string().uuid('La categoría es inválida'),
  playerIds: z
    .array(z.string().uuid())
    .min(MIN_ROSTER_SIZE, `Seleccioná al menos ${MIN_ROSTER_SIZE} jugadores`),
})

export async function createRegistrationWithPlayersAction(
  input: unknown,
  tournamentSlug: string,
  categorySlug: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createRegistrationSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    // Traer el equipo completo para obtener los DNI de los jugadores seleccionados
    const team = await teamService.getTeamById(parsed.data.teamId)
    const memberMap = new Map<string, { documentNumber: string | null; name: string }>(
      (team?.members ?? []).map(
        (m: { profile: { id: string; name: string; documentNumber?: string | null } }) => [
          m.profile.id,
          { documentNumber: m.profile.documentNumber ?? null, name: m.profile.name },
        ],
      ),
    )

    const initialRoster: { documentNumber: string; name: string }[] = []
    const missingDni: string[] = []

    for (const profileId of parsed.data.playerIds) {
      const member = memberMap.get(profileId)
      if (!member?.documentNumber) {
        missingDni.push(member?.name ?? profileId)
      } else {
        initialRoster.push({ documentNumber: member.documentNumber, name: member.name })
      }
    }

    if (missingDni.length > 0) {
      return {
        success: false,
        error: `Los siguientes jugadores no tienen DNI registrado: ${missingDni.join(', ')}`,
      }
    }

    const reg = await registrationService.createRegistration({
      teamId: parsed.data.teamId,
      tournamentId: parsed.data.tournamentId,
      categoryId: parsed.data.categoryId,
      initialRoster,
    })

    revalidatePath(`/torneos/${tournamentSlug}/${categorySlug}`)
    return { success: true, data: { id: reg?.id ?? 'new' } }
  } catch {
    return { success: false, error: 'No se pudo completar la inscripción' }
  }
}

const createMultiRegistrationSchema = z.object({
  tournamentId: z.string().uuid('El torneo es inválido'),
  categoryId: z.string().uuid('La categoría es inválida'),
  teams: z
    .array(
      z.object({
        teamId: z.string().uuid(),
        playerIds: z
          .array(z.string().uuid())
          .min(MIN_ROSTER_SIZE, `Seleccioná al menos ${MIN_ROSTER_SIZE} jugadores por equipo`),
      }),
    )
    .min(1, 'Seleccioná al menos un equipo'),
})

export async function createMultiRegistrationAction(
  input: unknown,
  tournamentSlug: string,
  categorySlug: string,
): Promise<ActionResult<{ ids: string[] }>> {
  const parsed = createMultiRegistrationSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    const ids: string[] = []
    const errors: string[] = []

    for (const entry of parsed.data.teams) {
      const team = await teamService.getTeamById(entry.teamId)
      const memberMap = new Map<string, { documentNumber: string | null; name: string }>(
        (team?.members ?? []).map(
          (m: { profile: { id: string; name: string; documentNumber?: string | null } }) => [
            m.profile.id,
            { documentNumber: m.profile.documentNumber ?? null, name: m.profile.name },
          ],
        ),
      )

      const initialRoster: { documentNumber: string; name: string }[] = []
      const missingDni: string[] = []

      for (const profileId of entry.playerIds) {
        const member = memberMap.get(profileId)
        if (!member?.documentNumber) {
          missingDni.push(member?.name ?? profileId)
        } else {
          initialRoster.push({ documentNumber: member.documentNumber, name: member.name })
        }
      }

      if (missingDni.length > 0) {
        errors.push(
          `${team?.name ?? 'Equipo'}: jugadores sin DNI: ${missingDni.join(', ')}`,
        )
        continue
      }

      const reg = await registrationService.createRegistration({
        teamId: entry.teamId,
        tournamentId: parsed.data.tournamentId,
        categoryId: parsed.data.categoryId,
        initialRoster,
      })

      ids.push(reg?.id ?? 'new')
    }

    if (ids.length === 0) {
      return { success: false, error: errors.join('. ') }
    }

    revalidatePath(`/torneos/${tournamentSlug}/${categorySlug}`)
    return { success: true, data: { ids } }
  } catch {
    return { success: false, error: 'No se pudo completar la inscripción' }
  }
}

export async function uploadPaymentVoucherAction(
  registrationId: string,
  // el archivo se sube directamente a Supabase Storage desde el cliente
  voucherUrl: string,
): Promise<ActionResult<void>> {
  void registrationId
  void voucherUrl
  // TODO: PATCH /registrations/:id/voucher
  revalidatePath('/torneos')
  return { success: true }
}
