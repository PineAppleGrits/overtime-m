import { HttpStatus, Inject, Injectable } from '@nestjs/common';
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

export interface GetCurrentPricingInput {
  tournamentId: string;
  /** Si se setea, busca match exacto y cae al fallback (`null`) si no encuentra. */
  paymentMethod?: PaymentMethod | null;
  /** Default = ahora. Permite cotizar precio para una fecha futura/pasada. */
  now?: Date;
}

/**
 * RN-048 — devuelve el pricing aplicable para `(tournamentId, paymentMethod, now)`,
 * o `null` si no hay ningún período aplicable.
 */
@Injectable()
export class GetCurrentPricingUseCase {
  constructor(
    @Inject(TOURNAMENT_LOOKUP_PORT)
    private readonly tournamentLookup: ITournamentLookupPort,
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(input: GetCurrentPricingInput): Promise<PricingRecord | null> {
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
    return pickApplicablePeriod(
      periods,
      input.paymentMethod ?? null,
      input.now ?? new Date(),
    );
  }
}
