import { z } from 'zod';

export const createRegistrationSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  tournamentId: z.string().uuid('Invalid tournament ID'),
  categoryId: z.string().uuid('Invalid category ID'),
});

export type CreateRegistrationDto = z.infer<typeof createRegistrationSchema>;
