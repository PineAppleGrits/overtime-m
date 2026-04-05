import { z } from 'zod';

export const addPlayerSchema = z.object({
  profileId: z.string().uuid('El jugador es invalido'),
});

export type AddPlayerDto = z.infer<typeof addPlayerSchema>;
