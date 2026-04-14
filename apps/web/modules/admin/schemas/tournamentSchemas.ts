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
})

export const changeStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'READY_TO_SHIP', 'IN_PROGRESS', 'FINISHED', 'ARCHIVED', 'CANCELLED']),
})

export const deleteTournamentSchema = z.object({ id: z.string().min(1) })

export const createCategorySchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio'),
  maxTeams: z.number().int().min(1).optional(),
  teamsPerZone: z.number().int().min(1).optional(),
})

export const updateCategorySchema = z.object({
  tournamentId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1, 'El nombre es obligatorio').optional(),
  maxTeams: z.number().int().min(1).optional().nullable(),
  teamsPerZone: z.number().int().min(1).optional().nullable(),
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

