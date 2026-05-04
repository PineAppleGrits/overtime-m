import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PAYMENT_METHODS } from '../../domain/rules/payment-method.rules';

const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const createPricingPeriodSchema = z
  .object({
    validFrom: z.string().datetime({ message: 'validFrom debe ser ISO date' }),
    validTo: z.string().datetime({ message: 'validTo debe ser ISO date' }),
    entryFeeAmount: z.coerce.number().min(0, 'El monto debe ser >= 0'),
    currency: z.string().trim().min(3).max(3).optional(),
    /** RN-048 — opcional. `null` o ausente = aplica a todos los métodos. */
    paymentMethod: paymentMethodSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.validFrom) >= new Date(value.validTo)) {
      ctx.addIssue({
        code: 'custom',
        path: ['validTo'],
        message: 'validTo debe ser posterior a validFrom',
      });
    }
  });

export type CreatePricingPeriodSchemaDto = z.infer<
  typeof createPricingPeriodSchema
>;

export const updatePricingPeriodSchema = z
  .object({
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional(),
    entryFeeAmount: z.coerce.number().min(0).optional(),
    currency: z.string().trim().min(3).max(3).optional(),
    paymentMethod: paymentMethodSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.validFrom &&
      value.validTo &&
      new Date(value.validFrom) >= new Date(value.validTo)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['validTo'],
        message: 'validTo debe ser posterior a validFrom',
      });
    }
  });

export type UpdatePricingPeriodSchemaDto = z.infer<
  typeof updatePricingPeriodSchema
>;

export class CreatePricingPeriodBodyDto extends createZodDto(
  createPricingPeriodSchema,
) {}

export class UpdatePricingPeriodBodyDto extends createZodDto(
  updatePricingPeriodSchema,
) {}

/**
 * Query schema para `GET /api/v1/tournaments/:id/pricing` y
 * `GET /api/v1/tournaments/:id/pricing/current`.
 */
export const pricingQuerySchema = z.object({
  method: paymentMethodSchema.optional(),
});

export type PricingQueryDto = z.infer<typeof pricingQuerySchema>;
