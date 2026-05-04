import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { PaymentMethod } from '../../domain/rules/payment-method.rules';
import { pickApplicablePeriod } from '../../domain/rules/pricing-overlap-with-method.rules';
import {
  IPricingRepository,
  PRICING_REPOSITORY,
  PricingRecord,
} from '../ports/pricing-repository.port';
import {
  ITournamentLookupPort,
  TOURNAMENT_LOOKUP_PORT,
} from '../ports/tournament-lookup.port';

export interface ComputeRegistrationFeeInput {
  tournamentId: string;
  paymentMethod?: PaymentMethod | null;
  /** Default = ahora. */
  registrationDate?: Date;
}

export interface ComputeRegistrationFeeResult {
  amount: Prisma.Decimal;
  currency: string;
  paymentMethod: PaymentMethod | null;
  period: PricingRecord;
}

/**
 * Use-case interno consumido por otros módulos (W2.2 PaymentsService) via
 * el `PricingService` facade.
 *
 * Lee el período de pricing aplicable y devuelve el `entryFeeAmount` como
 * `Prisma.Decimal` para evitar errores de redondeo en suma/resta.
 *
 * Lanza `PRICING_NOT_CONFIGURED` si no hay período aplicable.
 */
@Injectable()
export class ComputeRegistrationFeeUseCase {
  constructor(
    @Inject(TOURNAMENT_LOOKUP_PORT)
    private readonly tournamentLookup: ITournamentLookupPort,
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(
    input: ComputeRegistrationFeeInput,
  ): Promise<ComputeRegistrationFeeResult> {
    const exists = await this.tournamentLookup.exists(input.tournamentId);
    if (!exists) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Torneo con ID ${input.tournamentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    const periods = await this.pricingRepo.listByTournament({
      tournamentId: input.tournamentId,
    });
    const period = pickApplicablePeriod(
      periods,
      input.paymentMethod ?? null,
      input.registrationDate ?? new Date(),
    );

    if (!period) {
      throw new BusinessError(
        ErrorCode.PRICING_NOT_CONFIGURED,
        'No hay pricing configurado para este torneo en la fecha indicada',
        HttpStatus.UNPROCESSABLE_ENTITY,
        {
          tournamentId: input.tournamentId,
          paymentMethod: input.paymentMethod ?? null,
          registrationDate: (input.registrationDate ?? new Date()).toISOString(),
        },
      );
    }

    return {
      amount: new Prisma.Decimal(period.entryFeeAmount),
      currency: period.currency,
      paymentMethod: period.paymentMethod,
      period,
    };
  }
}
