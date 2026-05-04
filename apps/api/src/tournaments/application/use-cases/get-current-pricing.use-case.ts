import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { pickCurrentPeriod } from '../../domain/rules/pricing-overlap.rules';
import {
  IPricingRepository,
  PRICING_REPOSITORY,
  PricingRecord,
} from '../ports/pricing-repository.port';
import {
  ITournamentRepository,
  TOURNAMENT_REPOSITORY,
} from '../ports/tournament-repository.port';

/**
 * Devuelve el pricing vigente al momento `now` (default: ahora) o `null` si
 * no hay ningún período cubriendo ese instante.
 */
@Injectable()
export class GetCurrentPricingUseCase {
  constructor(
    @Inject(TOURNAMENT_REPOSITORY)
    private readonly tournamentRepo: ITournamentRepository,
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(
    tournamentId: string,
    now: Date = new Date(),
  ): Promise<PricingRecord | null> {
    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Torneo con ID ${tournamentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    const periods = await this.pricingRepo.listByTournament(tournamentId);
    return pickCurrentPeriod(periods, now);
  }
}
