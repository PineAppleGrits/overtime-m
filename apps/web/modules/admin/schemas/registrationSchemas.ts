import { z } from 'zod'

export const approveRegistrationSchema = z.object({ id: z.string().min(1) })
export const rejectRegistrationSchema = z.object({
  id: z.string().min(1),
  reason: z.string().optional(),
})
