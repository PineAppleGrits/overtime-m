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
import {
  ITournamentLookupPort,
  TOURNAMENT_LOOKUP_PORT,
} from '../ports/tournament-lookup.port';

export interface CreatePricingPeriodInput {
  tournamentId: string;
  validFrom: Date;
  validTo: Date;
  entryFeeAmount: number;
  currency?: string;
  paymentMethod?: PaymentMethod | null;
}

/**
 * RN-048 — crear un período de pricing considerando la dimensión "método de pago".
 *
 * Este use-case reemplaza al de W1.1 cuando se accede via el módulo Pricing,
 * sumando soporte para `paymentMethod`. Validaciones:
 *   - El torneo existe.
 *   - `validFrom < validTo`.
 *   - No hay conflicto con períodos existentes (considerando método).
 *
 * TODO: schema-v2 — paymentMethod columnar.
 */
@Injectable()
export class CreatePricingPeriodUseCase {
  private readonly logger = new Logger(CreatePricingPeriodUseCase.name);

  constructor(
    @Inject(TOURNAMENT_LOOKUP_PORT)
    private readonly tournamentLookup: ITournamentLookupPort,
    @Inject(PRICING_REPOSITORY)
    private readonly pricingRepo: IPricingRepository,
  ) {}

  async execute(input: CreatePricingPeriodInput): Promise<PricingRecord> {
    const exists = await this.tournamentLookup.exists(input.tournamentId);
    if (!exists) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Torneo con ID ${input.tournamentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    const candidate = {
      validFrom: input.validFrom,
      validTo: input.validTo,
      paymentMethod: input.paymentMethod ?? null,
    };

    if (!isValidPeriod(candidate)) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'La fecha de inicio del período debe ser anterior a la fecha de fin',
        HttpStatus.BAD_REQUEST,
        { validFrom: input.validFrom, validTo: input.validTo },
      );
    }

    const existing = await this.pricingRepo.listByTournament({
      tournamentId: input.tournamentId,
    });
    const conflict = findConflictingPeriod(candidate, existing);
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

    const created = await this.pricingRepo.create({
      tournamentId: input.tournamentId,
      validFrom: input.validFrom,
      validTo: input.validTo,
      entryFeeAmount: input.entryFeeAmount,
      currency: input.currency,
      paymentMethod: input.paymentMethod ?? null,
    });

    this.logger.log(
      `Pricing period created for tournament ${input.tournamentId} ` +
        `(${input.validFrom.toISOString()} → ${input.validTo.toISOString()}, ` +
        `method=${created.paymentMethod ?? 'all'})`,
    );

    return created;
  }
}
