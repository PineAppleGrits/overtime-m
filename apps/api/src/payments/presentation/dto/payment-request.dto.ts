import { createZodDto } from 'nestjs-zod';
import {
  createCheckoutSchema,
  createPaymentSchema,
  markAsFailedSchema,
  markAsPaidSchema,
} from './payment.zod';

export class CreateCheckoutBodyDto extends createZodDto(createCheckoutSchema) {}
export class CreatePaymentBodyDto extends createZodDto(createPaymentSchema) {}
export class MarkAsPaidBodyDto extends createZodDto(markAsPaidSchema) {}
export class MarkAsFailedBodyDto extends createZodDto(markAsFailedSchema) {}
