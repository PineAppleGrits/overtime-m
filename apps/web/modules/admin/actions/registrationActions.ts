'use server'

import { revalidatePath } from 'next/cache'
import registrationService from '@/modules/registration/RegistrationService'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import { approveRegistrationSchema, rejectRegistrationSchema } from '../schemas/registrationSchemas'
import type { ActionResult } from './types'
import { requireAuth } from '@/lib/auth/requireAuth'

export async function approveRegistrationAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = approveRegistrationSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT)
  try {
    await registrationService.approveRegistration(parsed.data.id)
    revalidatePath('/admin/inscripciones')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.REGISTRATION_APPROVE_FAILED)
  }
}

export async function rejectRegistrationAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = rejectRegistrationSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT)
  try {
    await registrationService.rejectRegistration(
      parsed.data.id,
      parsed.data.reason ? { rejectionReason: parsed.data.reason } : undefined,
    )
    revalidatePath('/admin/inscripciones')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.REGISTRATION_REJECT_FAILED)
  }
}
