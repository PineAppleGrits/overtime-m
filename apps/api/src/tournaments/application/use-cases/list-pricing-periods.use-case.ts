import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IPricingRepository,
  PRICING_REPOSITORY,
  PricingRecord,
} from '../ports/pricing-repository.port';
import {
  ITournamentRepository,
  TOURNAMENT_REPOSITORY,
} from '../ports/tournament-repository.port';

@Injectable()
export class ListPricingPeriodsUseCase {
  constructor(
    @Inject(TOURNAMENT_REPOSITORY)
    private readonly tournamentRepo: ITournamentRepository,
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(tournamentId: string): Promise<PricingRecord[]> {
    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Torneo con ID ${tournamentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.pricingRepo.listByTournament(tournamentId);
  }
}
