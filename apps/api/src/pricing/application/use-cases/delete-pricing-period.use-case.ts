import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IPricingRepository,
  PRICING_REPOSITORY,
} from '../ports/pricing-repository.port';

@Injectable()
export class DeletePricingPeriodUseCase {
  private readonly logger = new Logger(DeletePricingPeriodUseCase.name);

  constructor(
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(pricingId: string): Promise<{ deleted: true }> {
    const current = await this.pricingRepo.findById(pricingId);
    if (!current) {
      throw new BusinessError(
        ErrorCode.PRICING_PERIOD_NOT_FOUND,
        `Período de pricing con ID ${pricingId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.pricingRepo.delete(pricingId);
    this.logger.log(`Pricing period deleted: ${pricingId}`);
    return { deleted: true };
  }
}
