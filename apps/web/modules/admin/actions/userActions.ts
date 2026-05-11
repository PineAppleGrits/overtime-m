'use server'

import { revalidatePath } from 'next/cache'
import userService from '@/modules/user/UserService'
import { createUserSchema, updateUserSchema, deleteUserSchema } from '../schemas/userSchemas'
import type { ActionResult } from './types'
import { requireAuth } from '@/lib/auth/requireAuth'

export async function createUserAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { email, phone, documentNumber, dateOfBirth, ...rest } = parsed.data
  try {
    await userService.createUser({
      ...rest,
      email: email || undefined,
      phone: phone || undefined,
      documentNumber: documentNumber || undefined,
      dateOfBirth: dateOfBirth || undefined,
    })
    revalidateUserPaths()
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo crear el usuario' } }
}

export async function updateUserAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { id, email, phone, documentNumber, dateOfBirth, ...rest } = parsed.data
  try {
    await userService.updateUser(id, {
      ...rest,
      email: email || undefined,
      phone: phone || undefined,
      documentNumber: documentNumber || undefined,
      dateOfBirth: dateOfBirth || undefined,
    })
    revalidateUserPaths()
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo actualizar el usuario' } }
}

export async function deleteUserAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuth({ admin: true })
  if (!auth.ok) return auth.error
  const parsed = deleteUserSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await userService.deleteUser(parsed.data.id)
    revalidateUserPaths()
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo eliminar el usuario' } }
}

function revalidateUserPaths() {
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/jugadores')
  revalidatePath('/admin/empleados')
  revalidatePath('/admin/empleados/arbitros')
  revalidatePath('/admin/empleados/fotografos')
  revalidatePath('/admin/empleados/oficiales')
}
