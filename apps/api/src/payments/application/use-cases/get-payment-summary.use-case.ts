import { Inject, Injectable } from '@nestjs/common';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../ports/payment-repository.port';

export interface GetPaymentSummaryInput {
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetPaymentSummaryUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  execute(input: GetPaymentSummaryInput) {
    return this.repo.getSummary({
      startDate: input.startDate,
      endDate: input.endDate,
    });
  }
}
