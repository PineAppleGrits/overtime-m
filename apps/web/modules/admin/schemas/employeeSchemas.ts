import { z } from 'zod'

const employeeRoles = ['arbitro', 'fotografo', 'agente_mesa'] as const

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(employeeRoles),
})

export const updateEmployeeSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(employeeRoles),
})

export const toggleEmployeeActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
})

export const deleteEmployeeSchema = z.object({ id: z.string().min(1) })
