import { Inject, Injectable } from '@nestjs/common';
import {
  IPaymentRepository,
  ListPaymentsFilter,
  PAYMENT_REPOSITORY,
  PaymentWithRelations,
} from '../ports/payment-repository.port';

export interface ListPaymentsInput extends ListPaymentsFilter {}

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  async execute(input: ListPaymentsInput): Promise<{
    data: PaymentWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const result = await this.repo.list({
      ...input,
      page,
      limit,
      sortBy: input.sortBy ?? 'createdAt',
      sortOrder: input.sortOrder ?? 'desc',
    });
    return { ...result, page, limit };
  }
}
