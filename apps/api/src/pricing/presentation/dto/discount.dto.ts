import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createDiscountSchema = z.object({
  teamId: z.string().uuid({ message: 'teamId debe ser un UUID válido' }),
  amount: z.coerce
    .number()
    .positive('El monto del descuento debe ser mayor a 0'),
  currency: z.string().trim().min(3).max(3).optional(),
  concept: z.string().trim().min(1, 'concept no puede ser vacío').max(255),
  notes: z.string().trim().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** Si se setea, el descuento queda vinculado a una deuda existente (parentDebtId). */
  sourceDebtId: z.string().uuid().optional(),
});

export type CreateDiscountSchemaDto = z.infer<typeof createDiscountSchema>;

export class CreateDiscountBodyDto extends createZodDto(createDiscountSchema) {}

export const listDiscountsQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  includeCancelled: z
    .union([z.literal('true'), z.literal('1'), z.literal('false'), z.literal('0')])
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});

export type ListDiscountsQueryDto = z.infer<typeof listDiscountsQuerySchema>;

export const cancelDiscountSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelDiscountSchemaDto = z.infer<typeof cancelDiscountSchema>;

export class CancelDiscountBodyDto extends createZodDto(cancelDiscountSchema) {}
