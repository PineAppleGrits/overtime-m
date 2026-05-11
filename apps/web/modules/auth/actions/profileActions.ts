'use server'

import { revalidatePath } from 'next/cache'
import authService from '../AuthService'
import { requireAuth } from '@/lib/auth/requireAuth'

interface ActionResult {
  success: boolean
  error?: string
}

export async function updateDocumentNumberAction(
  documentNumber: string
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error
  const trimmed = documentNumber.trim()

  if (!/^\d{7,8}$/.test(trimmed)) {
    return { success: false, error: 'El DNI debe tener 7 u 8 dígitos numéricos' }
  }

  try {
    await authService.updateDocumentNumber(trimmed)
    revalidatePath('/profile')
    return { success: true }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'No se pudo actualizar el documento'
    console.error('Error updating document number:', error)
    return { success: false, error: message }
  }
}
