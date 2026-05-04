import { BusinessError, ErrorCode } from '../../../common/errors';
import { IPricingRepository, PricingRecord } from '../ports/pricing-repository.port';
import { ITournamentLookupPort } from '../ports/tournament-lookup.port';
import { CreatePricingPeriodUseCase } from './create-pricing-period.use-case';

const d = (iso: string): Date => new Date(iso);

const makeLookup = (exists = true): jest.Mocked<ITournamentLookupPort> => ({
  exists: jest.fn().mockResolvedValue(exists),
});

const makePricingRepo = (
  existing: PricingRecord[] = [],
): jest.Mocked<IPricingRepository> =>
  ({
    listByTournament: jest.fn().mockResolvedValue(existing),
    findById: jest.fn(),
    create: jest.fn().mockImplementation(async (input) => ({
      id: 'p-new',
      tournamentId: input.tournamentId,
      validFrom: input.validFrom,
      validTo: input.validTo,
      entryFeeAmount: input.entryFeeAmount,
      currency: input.currency ?? 'ARS',
      paymentMethod: input.paymentMethod ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: jest.fn(),
    delete: jest.fn(),
    findRawById: jest.fn(),
  }) as unknown as jest.Mocked<IPricingRepository>;

describe('CreatePricingPeriodUseCase', () => {
  it('crea período sin método (aplica a todos)', async () => {
    const lookup = makeLookup();
    const repo = makePricingRepo();
    const useCase = new CreatePricingPeriodUseCase(lookup, repo);

    const result = await useCase.execute({
      tournamentId: 't-1',
      validFrom: d('2026-01-01T00:00:00Z'),
      validTo: d('2026-01-31T00:00:00Z'),
      entryFeeAmount: 50000,
    });

    expect(result.paymentMethod).toBeNull();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: null }),
    );
  });

  it('crea períodos con métodos distintos en el mismo rango sin conflicto', async () => {
    const lookup = makeLookup();
    const repo = makePricingRepo([
      {
        id: 'p-cash',
        tournamentId: 't-1',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T00:00:00Z'),
        entryFeeAmount: 50000,
        currency: 'ARS',
        paymentMethod: 'cash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const useCase = new CreatePricingPeriodUseCase(lookup, repo);

    const result = await useCase.execute({
      tournamentId: 't-1',
      validFrom: d('2026-01-01T00:00:00Z'),
      validTo: d('2026-01-31T00:00:00Z'),
      entryFeeAmount: 60000,
      paymentMethod: 'transfer',
    });

    expect(result.paymentMethod).toBe('transfer');
    expect(repo.create).toHaveBeenCalled();
  });

  it('lanza PRICING_PERIOD_OVERLAP cuando solapan en mismo método', async () => {
    const lookup = makeLookup();
    const repo = makePricingRepo([
      {
        id: 'p-cash',
        tournamentId: 't-1',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T00:00:00Z'),
        entryFeeAmount: 50000,
        currency: 'ARS',
        paymentMethod: 'cash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const useCase = new CreatePricingPeriodUseCase(lookup, repo);

    await expect(
      useCase.execute({
        tournamentId: 't-1',
        validFrom: d('2026-01-15T00:00:00Z'),
        validTo: d('2026-02-15T00:00:00Z'),
        entryFeeAmount: 60000,
        paymentMethod: 'cash',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.PRICING_PERIOD_OVERLAP });

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('un período null colisiona con cualquier método existente en el mismo rango', async () => {
    const lookup = makeLookup();
    const repo = makePricingRepo([
      {
        id: 'p-cash',
        tournamentId: 't-1',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T00:00:00Z'),
        entryFeeAmount: 50000,
        currency: 'ARS',
        paymentMethod: 'cash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const useCase = new CreatePricingPeriodUseCase(lookup, repo);

    await expect(
      useCase.execute({
        tournamentId: 't-1',
        validFrom: d('2026-01-15T00:00:00Z'),
        validTo: d('2026-02-15T00:00:00Z'),
        entryFeeAmount: 70000,
        paymentMethod: null,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.PRICING_PERIOD_OVERLAP });
  });

  it('rechaza fechas inválidas (from >= to)', async () => {
    const useCase = new CreatePricingPeriodUseCase(
      makeLookup(),
      makePricingRepo(),
    );
    await expect(
      useCase.execute({
        tournamentId: 't-1',
        validFrom: d('2026-02-01T00:00:00Z'),
        validTo: d('2026-01-01T00:00:00Z'),
        entryFeeAmount: 1000,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });

  it('NOT_FOUND si torneo no existe', async () => {
    const useCase = new CreatePricingPeriodUseCase(
      makeLookup(false),
      makePricingRepo(),
    );
    await expect(
      useCase.execute({
        tournamentId: 'missing',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T00:00:00Z'),
        entryFeeAmount: 1000,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });
});
