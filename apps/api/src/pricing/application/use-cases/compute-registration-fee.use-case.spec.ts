import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import {
  IPricingRepository,
  PricingRecord,
} from '../ports/pricing-repository.port';
import { ITournamentLookupPort } from '../ports/tournament-lookup.port';
import { ComputeRegistrationFeeUseCase } from './compute-registration-fee.use-case';

const d = (iso: string): Date => new Date(iso);

const makeLookup = (exists = true): jest.Mocked<ITournamentLookupPort> => ({
  exists: jest.fn().mockResolvedValue(exists),
});

const makeRepo = (
  periods: PricingRecord[],
): jest.Mocked<IPricingRepository> =>
  ({
    listByTournament: jest.fn().mockResolvedValue(periods),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findRawById: jest.fn(),
  }) as unknown as jest.Mocked<IPricingRepository>;

describe('ComputeRegistrationFeeUseCase', () => {
  const fallback: PricingRecord = {
    id: 'p-fallback',
    tournamentId: 't-1',
    validFrom: d('2026-01-01T00:00:00Z'),
    validTo: d('2026-03-31T00:00:00Z'),
    entryFeeAmount: 50000,
    currency: 'ARS',
    paymentMethod: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const cashSpecific: PricingRecord = {
    ...fallback,
    id: 'p-cash',
    paymentMethod: 'cash',
    entryFeeAmount: 45000, // 10% off para cash
  };

  it('devuelve match exacto sobre fallback', async () => {
    const useCase = new ComputeRegistrationFeeUseCase(
      makeLookup(),
      makeRepo([fallback, cashSpecific]),
    );

    const result = await useCase.execute({
      tournamentId: 't-1',
      paymentMethod: 'cash',
      registrationDate: d('2026-02-15T00:00:00Z'),
    });

    expect(result.period.id).toBe('p-cash');
    expect(result.amount).toBeInstanceOf(Prisma.Decimal);
    expect(result.amount.toNumber()).toBe(45000);
    expect(result.paymentMethod).toBe('cash');
    expect(result.currency).toBe('ARS');
  });

  it('cae al fallback cuando no hay match exacto', async () => {
    const useCase = new ComputeRegistrationFeeUseCase(
      makeLookup(),
      makeRepo([fallback, cashSpecific]),
    );

    const result = await useCase.execute({
      tournamentId: 't-1',
      paymentMethod: 'transfer',
      registrationDate: d('2026-02-15T00:00:00Z'),
    });

    expect(result.period.id).toBe('p-fallback');
    expect(result.amount.toNumber()).toBe(50000);
  });

  it('lanza PRICING_NOT_CONFIGURED si no hay período aplicable', async () => {
    const useCase = new ComputeRegistrationFeeUseCase(
      makeLookup(),
      makeRepo([cashSpecific]),
    );

    await expect(
      useCase.execute({
        tournamentId: 't-1',
        paymentMethod: 'transfer',
        registrationDate: d('2026-02-15T00:00:00Z'),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.PRICING_NOT_CONFIGURED });
  });

  it('lanza NOT_FOUND si torneo no existe', async () => {
    const useCase = new ComputeRegistrationFeeUseCase(
      makeLookup(false),
      makeRepo([]),
    );
    await expect(
      useCase.execute({ tournamentId: 'missing' }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});
