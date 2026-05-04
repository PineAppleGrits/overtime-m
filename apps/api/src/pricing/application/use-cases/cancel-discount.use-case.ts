import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { isDiscountMetadata } from '../../domain/rules/discount-amount.rules';
import {
  DISCOUNT_REPOSITORY,
  DiscountRecord,
  IDiscountRepository,
} from '../ports/discount-repository.port';

export interface CancelDiscountInput {
  discountId: string;
  cancelledByProfileId: string;
  reason?: string;
}

/**
 * RN-020 — cancelar un descuento previamente aplicado. Usa la lógica de
 * `Debt.status = CANCELLED` (W2.1 maneja el audit log).
 */
@Injectable()
export class CancelDiscountUseCase {
  private readonly logger = new Logger(CancelDiscountUseCase.name);

  constructor(
    @Inject(DISCOUNT_REPOSITORY)
    private readonly discountRepo: IDiscountRepository,
  ) {}

  async execute(input: CancelDiscountInput): Promise<DiscountRecord> {
    const current = await this.discountRepo.findById(input.discountId);
    if (!current || !isDiscountMetadata(current.metadata)) {
      throw new BusinessError(
        ErrorCode.DISCOUNT_NOT_FOUND,
        `Descuento con ID ${input.discountId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (current.status === 'CANCELLED') {
      throw new BusinessError(
        ErrorCode.DISCOUNT_ALREADY_CANCELLED,
        'El descuento ya estaba cancelado',
        HttpStatus.CONFLICT,
        { discountId: input.discountId },
      );
    }

    const cancelled = await this.discountRepo.cancel(
      input.discountId,
      input.cancelledByProfileId,
      input.reason,
    );

    this.logger.log(
      `Discount cancelled: ${input.discountId} by ${input.cancelledByProfileId}`,
    );
    return cancelled;
  }
}
