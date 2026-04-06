'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import registrationService from '@/modules/registration/RegistrationService'
import type { ActionResult } from '@/modules/admin/actions/types'

const createRegistrationSchema = z.object({
  teamId: z.string().uuid(),
  tournamentId: z.string().uuid(),
  categoryId: z.string().uuid(),
  playerIds: z.array(z.string().uuid()).min(1, 'Seleccioná al menos un jugador'),
})

export async function createRegistrationWithPlayersAction(
  input: unknown,
  tournamentSlug: string,
  categorySlug: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createRegistrationSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }
  try {
    // TODO: el backend recibirá playerIds cuando esté listo
    const reg = await registrationService.createRegistration({
      teamId: parsed.data.teamId,
      tournamentId: parsed.data.tournamentId,
      categoryId: parsed.data.categoryId,
    })
    revalidatePath(`/torneos/${tournamentSlug}/${categorySlug}`)
    return { success: true, data: { id: reg?.id ?? 'new' } }
  } catch {
    return { success: false, error: 'No se pudo completar la inscripción' }
  }
}

export async function uploadPaymentVoucherAction(
  registrationId: string,
  // file se maneja en el cliente y se sube directamente a Supabase Storage
  voucherUrl: string,
): Promise<ActionResult<void>> {
  // Suppress unused variable warnings — these will be used when the endpoint is ready
  void registrationId
  void voucherUrl
  // TODO: PATCH /registrations/:id/voucher
  revalidatePath('/torneos')
  return { success: true }
}
