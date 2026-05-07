'use server'

import { revalidatePath } from 'next/cache'
import employeeService from '@/modules/employee/EmployeeService'
import { ErrorCode, actionFailure } from '@/modules/common/errors'
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  toggleEmployeeActiveSchema,
  deleteEmployeeSchema,
} from '../schemas/employeeSchemas'
import type { ActionResult } from './types'

export async function createEmployeeAction(input: unknown): Promise<ActionResult> {
  const parsed = createEmployeeSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await employeeService.createEmployee(parsed.data)
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.EMPLOYEE_CREATE_FAILED)
  }
}

export async function updateEmployeeAction(input: unknown): Promise<ActionResult> {
  const parsed = updateEmployeeSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  const { id, ...data } = parsed.data
  try {
    await employeeService.updateEmployee(id, data)
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.EMPLOYEE_UPDATE_FAILED)
  }
}

export async function toggleEmployeeActiveAction(input: unknown): Promise<ActionResult> {
  const parsed = toggleEmployeeActiveSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await employeeService.updateEmployee(parsed.data.id, { isActive: parsed.data.isActive })
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.STATUS_CHANGE_FAILED)
  }
}

export async function deleteEmployeeAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteEmployeeSchema.safeParse(input)
  if (!parsed.success) return actionFailure(ErrorCode.INVALID_INPUT, parsed.error.issues[0]?.message)
  try {
    await employeeService.deleteEmployee(parsed.data.id)
    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (error) {
    console.error(error)
    return actionFailure(ErrorCode.EMPLOYEE_DELETE_FAILED)
  }
}
