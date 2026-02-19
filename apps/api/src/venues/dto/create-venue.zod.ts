import { z } from 'zod';

export const createVenueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  country: z.string().optional().default('Argentina'),
  googleMapsUrl: z
    .string()
    .url('Invalid Google Maps URL')
    .optional()
    .nullable(),
  capacity: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateVenueDto = z.infer<typeof createVenueSchema>;
