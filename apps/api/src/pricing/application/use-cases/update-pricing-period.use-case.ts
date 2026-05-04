import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { PaymentMethod } from '../../domain/rules/payment-method.rules';
import {
  findConflictingPeriod,
  isValidPeriod,
} from '../../domain/rules/pricing-overlap-with-method.rules';
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
  /** `undefined` deja el método como está; `null` explícitamente lo blanquea (aplica a todos). */
  paymentMethod?: PaymentMethod | null;
}

/**
 * RN-048 — actualizar un período de pricing.
 *
 * Si se cambian fechas o método, revalida el conflicto.
 *
 * TODO: schema-v2 — paymentMethod columnar.
 */
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
    const paymentMethod =
      input.paymentMethod === undefined
        ? current.paymentMethod
        : input.paymentMethod;

    if (!isValidPeriod({ validFrom, validTo })) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'La fecha de inicio del período debe ser anterior a la fecha de fin',
        HttpStatus.BAD_REQUEST,
        { validFrom, validTo },
      );
    }

    const datesChanged =
      input.validFrom !== undefined || input.validTo !== undefined;
    const methodChanged = input.paymentMethod !== undefined;

    if (datesChanged || methodChanged) {
      const siblings = await this.pricingRepo.listByTournament({
        tournamentId: current.tournamentId,
      });
      const conflict = findConflictingPeriod(
        { validFrom, validTo, paymentMethod },
        siblings,
        current.id,
      );
      if (conflict) {
        throw new BusinessError(
          ErrorCode.PRICING_PERIOD_OVERLAP,
          'El período se solapa con uno existente para el mismo método de pago',
          HttpStatus.CONFLICT,
          {
            conflictingPeriodId: conflict.id,
            validFrom: conflict.validFrom,
            validTo: conflict.validTo,
            paymentMethod: conflict.paymentMethod,
          },
        );
      }
    }

    const updated = await this.pricingRepo.update(input.pricingId, {
      validFrom: input.validFrom,
      validTo: input.validTo,
      entryFeeAmount: input.entryFeeAmount,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
    });

    this.logger.log(
      `Pricing period updated: ${input.pricingId} (method=${updated.paymentMethod ?? 'all'})`,
    );
    return updated;
  }
}
