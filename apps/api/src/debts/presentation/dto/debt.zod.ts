import { z } from 'zod';

/**
 * Schemas Zod para los inputs HTTP de Debts. Locales al módulo —
 * el FE los obtiene del OpenAPI auto-generado.
 */

const isoDateString = z
  .string()
  .min(1, 'Fecha requerida')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida (ISO)');

const debtTypeEnum = z.enum([
  'REGISTRATION_FEE',
  'INSURANCE',
  'LATE_ROSTER_FEE',
  'MATCH_FEE',
  'FRIENDLY_DEPOSIT',
  'MISSED_MATCH_FINE',
  'LATE_NOTICE_FINE',
  'LATE_PAYMENT_DAILY_CHARGE',
  'OVERDUE_INTEREST',
  'AJC_FEE',
  'OTHER_MANUAL',
]);

const debtStatusEnum = z.enum([
  'APPROVED',
  'PARTIALLY_PAID',
  'PAID',
  'DELETED_BY_ERROR',
  'DELETED_WITH_RECORD',
  'CANCELLED',
]);

export const createDebtSchema = z
  .object({
    type: debtTypeEnum,
    concept: z.string().min(1).max(500),
    originAmount: z.number().positive('originAmount debe ser > 0'),
    dueDate: isoDateString,
    currency: z.string().min(3).max(3).optional(),
    teamId: z.string().uuid('teamId inválido').optional(),
    profileId: z.string().uuid('profileId inválido').optional(),
    registrationId: z.string().uuid().optional(),
    matchId: z.string().uuid().optional(),
    friendlyId: z.string().uuid().optional(),
    sanctionId: z.string().uuid().optional(),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => Boolean(d.teamId) || Boolean(d.profileId), {
    message: 'Al menos uno de teamId/profileId debe estar presente',
    path: ['teamId'],
  });

export type CreateDebtSchemaDto = z.infer<typeof createDebtSchema>;

export const changeDebtStatusSchema = z.object({
  toStatus: debtStatusEnum,
  reason: z.string().min(1).max(1000).optional(),
});

export type ChangeDebtStatusSchemaDto = z.infer<typeof changeDebtStatusSchema>;

export { debtTypeEnum, debtStatusEnum };
