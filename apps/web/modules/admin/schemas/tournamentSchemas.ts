import { z } from 'zod'

export const createTournamentSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  sportId: z.string().min(1, 'La disciplina es obligatoria'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().min(1, 'La fecha de fin es obligatoria'),
  registrationStartDate: z.string().optional(),
  registrationEndDate: z.string().optional(),
})

export const updateTournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sportId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  registrationStartDate: z.string().optional(),
  registrationEndDate: z.string().optional(),
  registrationOpen: z.boolean().optional(),
})

export const changeStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived']),
})

export const closeRegistrationsSchema = z.object({ id: z.string().min(1) })

export const createPricingSchema = z.object({
  tournamentId: z.string().min(1),
  paymentMethod: z.enum(['transferencia', 'efectivo', 'configurado']),
  amount: z.number().positive('El monto debe ser positivo'),
  dateFrom: z.string().min(1, 'La fecha desde es obligatoria'),
  dateTo: z.string().min(1, 'La fecha hasta es obligatoria'),
})

export const deletePricingSchema = z.object({
  tournamentId: z.string().min(1),
  pricingId: z.string().min(1),
})

export const deleteTournamentSchema = z.object({ id: z.string().min(1) })

export const createCategorySchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio'),
  sportId: z.string().min(1, 'La disciplina es obligatoria'),
  teamsPerZone: z.number().optional(),
})

export const deleteCategorySchema = z.object({
  tournamentId: z.string().min(1),
  categoryId: z.string().min(1),
})

export const createZoneSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio'),
})

export const deleteZoneSchema = z.object({
  categoryId: z.string().min(1),
  zoneId: z.string().min(1),
})

export const approveRegistrationTournamentSchema = z.object({
  tournamentId: z.string().min(1),
  registrationId: z.string().min(1),
})

export const rejectRegistrationTournamentSchema = z.object({
  tournamentId: z.string().min(1),
  registrationId: z.string().min(1),
  rejectionReason: z.string().optional(),
})

export const confirmPaymentSchema = z.object({
  tournamentId: z.string().min(1),
  registrationId: z.string().min(1),
})

export const manualRegistrationSchema = z.object({
  tournamentId: z.string().min(1),
  teamId: z.string().min(1, 'Selecciona un equipo'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  paymentMethod: z.enum(['transferencia', 'efectivo', 'configurado']).optional(),
  paymentAmount: z.number().optional(),
  autoApprove: z.boolean().optional(),
})
