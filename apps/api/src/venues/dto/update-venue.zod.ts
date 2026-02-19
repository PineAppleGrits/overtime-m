import { z } from 'zod';

export const updateVenueSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  country: z.string().optional(),
  googleMapsUrl: z
    .string()
    .url('Invalid Google Maps URL')
    .optional()
    .nullable(),
  capacity: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateVenueDto = z.infer<typeof updateVenueSchema>;
