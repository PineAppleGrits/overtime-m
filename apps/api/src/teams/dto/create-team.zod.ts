import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  logoUrl: z.string().url('Invalid URL').optional().nullable(),
  sportId: z.string().uuid('Invalid sport ID'),
  captainId: z.string().uuid('Invalid captain ID').optional().nullable(),
});

export type CreateTeamDto = z.infer<typeof createTeamSchema>;
