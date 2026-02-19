import { z } from 'zod';

export const TournamentStatusEnum = z.enum([
  'draft',
  'visible',
  'invisible',
  'inscripcion_cerrada',
  'finalizado',
  'archivado',
]);

export const createTournamentSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    sportId: z.string().uuid('Invalid sport ID'),
    status: TournamentStatusEnum.optional().default('draft'),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    registrationStartDate: z.string().datetime().optional().nullable(),
    registrationEndDate: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before end date',
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      if (data.registrationStartDate && data.registrationEndDate) {
        return (
          new Date(data.registrationStartDate) <=
          new Date(data.registrationEndDate)
        );
      }
      return true;
    },
    {
      message: 'Registration start date must be before registration end date',
      path: ['registrationEndDate'],
    },
  );

export type CreateTournamentDto = z.infer<typeof createTournamentSchema>;
