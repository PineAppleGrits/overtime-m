import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  findOverlappingPeriod,
  isValidPeriod,
} from '../../domain/rules/pricing-overlap.rules';
import {
  IPricingRepository,
  PRICING_REPOSITORY,
  PricingRecord,
} from '../ports/pricing-repository.port';

export interface UpdatePricingPeriodInput {
  pricingId: string;
  validFrom?: Date;
  validTo?: Date;
  entryFeeAmount?: number;
  currency?: string;
}

@Injectable()
export class UpdatePricingPeriodUseCase {
  private readonly logger = new Logger(UpdatePricingPeriodUseCase.name);

  constructor(
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(input: UpdatePricingPeriodInput): Promise<PricingRecord> {
    const current = await this.pricingRepo.findById(input.pricingId);
    if (!current) {
      throw new BusinessError(
        ErrorCode.PRICING_PERIOD_NOT_FOUND,
        `Período de pricing con ID ${input.pricingId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    const validFrom = input.validFrom ?? current.validFrom;
    const validTo = input.validTo ?? current.validTo;

    if (!isValidPeriod({ validFrom, validTo })) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'La fecha de inicio del período debe ser anterior a la fecha de fin',
        HttpStatus.BAD_REQUEST,
        { validFrom, validTo },
      );
    }

    // Si se cambian las fechas, revalidar overlap.
    if (input.validFrom || input.validTo) {
      const siblings = await this.pricingRepo.listByTournament(
        current.tournamentId,
      );
      const overlap = findOverlappingPeriod(
        { validFrom, validTo },
        siblings,
        current.id,
      );
      if (overlap) {
        throw new BusinessError(
          ErrorCode.PRICING_PERIOD_OVERLAP,
          'El período se solapa con uno existente',
          HttpStatus.CONFLICT,
          {
            conflictingPeriodId: overlap.id,
            validFrom: overlap.validFrom,
            validTo: overlap.validTo,
          },
        );
      }
    }

    const updated = await this.pricingRepo.update(input.pricingId, {
      validFrom: input.validFrom,
      validTo: input.validTo,
      entryFeeAmount: input.entryFeeAmount,
      currency: input.currency,
    });

    this.logger.log(`Pricing period updated: ${input.pricingId}`);
    return updated;
  }
}
