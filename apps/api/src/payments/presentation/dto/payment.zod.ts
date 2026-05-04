import { z } from 'zod';

/** Métodos aceptados por el body de creación manual / mark-paid. */
const paymentMethodEnum = z.enum([
  'mercadopago',
  'cash',
  'transferencia',
  'transfer',
  'other',
]);

/** Tipos de checkout (resource del checkout). */
const checkoutTypeEnum = z.enum(['debt', 'registration', 'match']);

export const createCheckoutSchema = z
  .object({
    type: checkoutTypeEnum,
    debtId: z.string().uuid().optional(),
    registrationId: z.string().uuid().optional(),
    matchId: z.string().uuid().optional(),
  })
  .refine(
    (d) => {
      if (d.type === 'debt') return Boolean(d.debtId);
      if (d.type === 'registration') return Boolean(d.registrationId);
      if (d.type === 'match') return Boolean(d.matchId);
      return false;
    },
    { message: 'Falta el id correspondiente al type', path: ['type'] },
  );

export type CreateCheckoutInputDto = z.infer<typeof createCheckoutSchema>;

export const createPaymentSchema = z
  .object({
    debtId: z.string().uuid().optional(),
    registrationId: z.string().uuid().optional(),
    matchId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    currency: z.string().min(3).max(3).optional(),
    method: paymentMethodEnum,
  })
  .refine(
    (d) => Boolean(d.debtId) || Boolean(d.registrationId) || Boolean(d.matchId),
    {
      message: 'Debe proveerse debtId, registrationId o matchId',
      path: ['debtId'],
    },
  )
  .refine((d) => !(d.registrationId && d.matchId), {
    message: 'No se puede proveer registrationId y matchId a la vez',
    path: ['registrationId'],
  });

export type CreatePaymentInputDto = z.infer<typeof createPaymentSchema>;

export const markAsPaidSchema = z.object({
  externalReference: z.string().optional(),
  notes: z.string().max(2000).optional(),
});
export type MarkAsPaidInputDto = z.infer<typeof markAsPaidSchema>;

export const markAsFailedSchema = z.object({
  reason: z.string().min(1).max(500),
});
export type MarkAsFailedInputDto = z.infer<typeof markAsFailedSchema>;

export { paymentMethodEnum, checkoutTypeEnum };
