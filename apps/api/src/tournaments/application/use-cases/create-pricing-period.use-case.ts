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
import {
  ITournamentRepository,
  TOURNAMENT_REPOSITORY,
} from '../ports/tournament-repository.port';

export interface CreatePricingPeriodInput {
  tournamentId: string;
  validFrom: Date;
  validTo: Date;
  entryFeeAmount: number;
  currency?: string;
}

/**
 * RN-048 — crear un período de pricing. Valida:
 * - El torneo existe.
 * - `validFrom < validTo`.
 * - El nuevo período no se superpone con uno existente.
 */
@Injectable()
export class CreatePricingPeriodUseCase {
  private readonly logger = new Logger(CreatePricingPeriodUseCase.name);

  constructor(
    @Inject(TOURNAMENT_REPOSITORY)
    private readonly tournamentRepo: ITournamentRepository,
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(input: CreatePricingPeriodInput): Promise<PricingRecord> {
    const tournament = await this.tournamentRepo.findById(input.tournamentId);
    if (!tournament) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Torneo con ID ${input.tournamentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    const candidate = {
      validFrom: input.validFrom,
      validTo: input.validTo,
    };

    if (!isValidPeriod(candidate)) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'La fecha de inicio del período debe ser anterior a la fecha de fin',
        HttpStatus.BAD_REQUEST,
        {
          validFrom: input.validFrom,
          validTo: input.validTo,
        },
      );
    }

    const existing = await this.pricingRepo.listByTournament(
      input.tournamentId,
    );
    const overlap = findOverlappingPeriod(candidate, existing);
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

    const created = await this.pricingRepo.create({
      tournamentId: input.tournamentId,
      validFrom: input.validFrom,
      validTo: input.validTo,
      entryFeeAmount: input.entryFeeAmount,
      currency: input.currency,
    });

    this.logger.log(
      `Pricing period created for tournament ${tournament.id} (${input.validFrom.toISOString()} → ${input.validTo.toISOString()})`,
    );

    return created;
  }
}
