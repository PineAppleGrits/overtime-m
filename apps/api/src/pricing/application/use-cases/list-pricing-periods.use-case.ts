import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { PaymentMethod } from '../../domain/rules/payment-method.rules';
import {
  IPricingRepository,
  PRICING_REPOSITORY,
  PricingRecord,
} from '../ports/pricing-repository.port';
import {
  ITournamentLookupPort,
  TOURNAMENT_LOOKUP_PORT,
} from '../ports/tournament-lookup.port';

export interface ListPricingPeriodsInput {
  tournamentId: string;
  /** Si se setea, sólo devuelve períodos para ese método específico
   *  (no incluye los de `paymentMethod=null` que aplican a todos). */
  paymentMethod?: PaymentMethod;
}

@Injectable()
export class ListPricingPeriodsUseCase {
  constructor(
    @Inject(TOURNAMENT_LOOKUP_PORT)
    private readonly tournamentLookup: ITournamentLookupPort,
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(input: ListPricingPeriodsInput): Promise<PricingRecord[]> {
    const exists = await this.tournamentLookup.exists(input.tournamentId);
    if (!exists) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Torneo con ID ${input.tournamentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.pricingRepo.listByTournament({
      tournamentId: input.tournamentId,
      paymentMethod: input.paymentMethod,
    });
  }
}
