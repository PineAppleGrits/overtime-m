import { Inject, Injectable } from '@nestjs/common';
import {
  DISCOUNT_REPOSITORY,
  DiscountRecord,
  IDiscountRepository,
} from '../ports/discount-repository.port';

export interface ListDiscountsInput {
  teamId?: string;
  includeCancelled?: boolean;
}

@Injectable()
export class ListDiscountsUseCase {
  constructor(
    @Inject(DISCOUNT_REPOSITORY)
    private readonly discountRepo: IDiscountRepository,
  ) {}

  execute(input: ListDiscountsInput): Promise<DiscountRecord[]> {
    return this.discountRepo.list({
      teamId: input.teamId,
      includeCancelled: input.includeCancelled ?? false,
    });
  }
}
