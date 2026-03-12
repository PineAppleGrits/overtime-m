'use server'

import { revalidatePath } from 'next/cache'
import employeeService from '@/modules/employee/EmployeeService'
import { createEmployeeSchema, updateEmployeeSchema, toggleEmployeeActiveSchema, deleteEmployeeSchema } from '../schemas/employeeSchemas'
import type { ActionResult } from './types'

export async function createEmployeeAction(input: unknown): Promise<ActionResult> {
  const parsed = createEmployeeSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await employeeService.createEmployee(parsed.data)
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo crear el empleado' } }
}

export async function updateEmployeeAction(input: unknown): Promise<ActionResult> {
  const parsed = updateEmployeeSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const { id, ...data } = parsed.data
  try {
    await employeeService.updateEmployee(id, data)
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo actualizar el empleado' } }
}

export async function toggleEmployeeActiveAction(input: unknown): Promise<ActionResult> {
  const parsed = toggleEmployeeActiveSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await employeeService.updateEmployee(parsed.data.id, { isActive: parsed.data.isActive })
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo cambiar el estado' } }
}

export async function deleteEmployeeAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteEmployeeSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  try {
    await employeeService.deleteEmployee(parsed.data.id)
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) { console.error(error); return { success: false, error: 'No se pudo eliminar el empleado' } }
}
