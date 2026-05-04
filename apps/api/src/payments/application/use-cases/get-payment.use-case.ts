import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
  PaymentWithRelations,
} from '../ports/payment-repository.port';

@Injectable()
export class GetPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  async execute(paymentId: string): Promise<PaymentWithRelations> {
    const payment = await this.repo.findById(paymentId);
    if (!payment) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Pago ${paymentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    return payment;
  }
}
