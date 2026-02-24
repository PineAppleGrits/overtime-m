import { z } from 'zod';

export const MatchStatusEnum = z.enum([
  'programado',
  'en_curso',
  'suspendido',
  'cancelado',
  'reprogramado',
  'finalizado',
]);

export const MatchTypeEnum = z.enum(['regular', 'amistoso']);

export const createMatchSchema = z
  .object({
    homeTeamId: z.string().uuid('Invalid home team ID'),
    awayTeamId: z.string().uuid('Invalid away team ID'),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    zoneId: z.string().uuid('Invalid zone ID').optional().nullable(),
    venueId: z.string().uuid('Invalid venue ID').optional().nullable(),
    matchDate: z.string().datetime('Invalid date format'),
    matchTime: z.string().optional().nullable(),
    status: MatchStatusEnum.optional().default('programado'),
    matchType: MatchTypeEnum.optional().default('regular'),
    homeScore: z.number().int().min(0).optional().default(0),
    awayScore: z.number().int().min(0).optional().default(0),
    costPerTeam: z.number().min(0).optional().nullable(),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: 'Home and away teams cannot be the same',
    path: ['awayTeamId'],
  })
  .refine(
    (data) => {
      if (data.matchType === 'amistoso' && data.categoryId) {
        return false;
      }
      return true;
    },
    {
      message: 'Friendly matches cannot have a category',
      path: ['categoryId'],
    },
  );

export type CreateMatchDto = z.infer<typeof createMatchSchema>;
