import { Inject, Injectable } from '@nestjs/common';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
  PaymentWithRelations,
} from '../ports/payment-repository.port';

export interface GetMyPaymentsInput {
  profileId: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetMyPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  async execute(input: GetMyPaymentsInput): Promise<{
    data: PaymentWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const result = await this.repo.list({
      profileId: input.profileId,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    return { ...result, page, limit };
  }
}
