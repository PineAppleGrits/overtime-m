import { z } from 'zod';

/**
 * Schemas Zod para los inputs HTTP de Friendlies. Mantenemos los schemas
 * locales al módulo (no en `@overtime-mono/shared`) para no tocar el package
 * compartido en esta PR — el FE puede tomarlos del OpenAPI auto-generado.
 */

const isoDateString = z
  .string()
  .min(1, 'Fecha requerida')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida (ISO)');

export const requestFriendlySchema = z
  .object({
    homeTeamId: z.string().uuid('homeTeamId inválido'),
    awayTeamId: z.string().uuid('awayTeamId inválido'),
    modality: z.enum(['3v3', '5v5']),
    proposedDate: isoDateString,
    venueId: z.string().uuid('venueId inválido').optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.homeTeamId !== d.awayTeamId, {
    message: 'El equipo local y visitante no pueden ser el mismo',
    path: ['awayTeamId'],
  });

export type RequestFriendlySchemaDto = z.infer<typeof requestFriendlySchema>;

export const generateFriendlySchema = z.object({
  /**
   * Monto de la seña por equipo. DP-017 abierta — por ahora se pasa explícito
   * desde el body por el admin.
   */
  depositAmount: z.number().positive('depositAmount debe ser > 0'),
  currency: z.string().min(3).max(3).optional(),
  confirmationWindowHours: z.number().int().positive().max(168).optional(),
});

export type GenerateFriendlySchemaDto = z.infer<typeof generateFriendlySchema>;

export const cancelFriendlySchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export type CancelFriendlySchemaDto = z.infer<typeof cancelFriendlySchema>;
