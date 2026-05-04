import { BusinessError, ErrorCode } from '../../../common/errors';
import { IPricingRepository } from '../ports/pricing-repository.port';
import { ITournamentRepository } from '../ports/tournament-repository.port';
import { CreatePricingPeriodUseCase } from './create-pricing-period.use-case';

const d = (iso: string): Date => new Date(iso);

const makeTournamentRepo = (
  exists = true,
): jest.Mocked<ITournamentRepository> =>
  ({
    findById: jest
      .fn()
      .mockResolvedValue(
        exists ? ({ id: 't-1', status: 'OPEN' } as never) : null,
      ),
    findBySlug: jest.fn(),
    findBySportId: jest.fn(),
    slugExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  }) as jest.Mocked<ITournamentRepository>;

const makePricingRepo = (
  existing: Array<{
    id: string;
    validFrom: Date;
    validTo: Date;
  }> = [],
): jest.Mocked<IPricingRepository> =>
  ({
    listByTournament: jest.fn().mockResolvedValue(existing as never),
    findById: jest.fn(),
    create: jest
      .fn()
      .mockImplementation(async (input) => ({
        id: 'p-new',
        tournamentId: input.tournamentId,
        validFrom: input.validFrom,
        validTo: input.validTo,
        entryFeeAmount: input.entryFeeAmount,
        currency: input.currency ?? 'ARS',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    update: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<IPricingRepository>;

describe('CreatePricingPeriodUseCase', () => {
  it('crea período cuando no hay overlap', async () => {
    const tRepo = makeTournamentRepo();
    const pRepo = makePricingRepo();
    const useCase = new CreatePricingPeriodUseCase(tRepo, pRepo);

    const result = await useCase.execute({
      tournamentId: 't-1',
      validFrom: d('2026-01-01T00:00:00Z'),
      validTo: d('2026-01-31T00:00:00Z'),
      entryFeeAmount: 50000,
    });

    expect(result.id).toBe('p-new');
    expect(pRepo.create).toHaveBeenCalled();
  });

  it('lanza CONFLICT(PRICING_PERIOD_OVERLAP) cuando hay solapamiento', async () => {
    const tRepo = makeTournamentRepo();
    const pRepo = makePricingRepo([
      {
        id: 'p-existing',
        validFrom: d('2026-01-15T00:00:00Z'),
        validTo: d('2026-02-15T00:00:00Z'),
      },
    ]);
    const useCase = new CreatePricingPeriodUseCase(tRepo, pRepo);

    try {
      await useCase.execute({
        tournamentId: 't-1',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T00:00:00Z'),
        entryFeeAmount: 50000,
      });
      fail('expected BusinessError');
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessError);
      expect((err as BusinessError).code).toBe(
        ErrorCode.PRICING_PERIOD_OVERLAP,
      );
    }

    expect(pRepo.create).not.toHaveBeenCalled();
  });

  it('rechaza cuando validFrom >= validTo', async () => {
    const tRepo = makeTournamentRepo();
    const pRepo = makePricingRepo();
    const useCase = new CreatePricingPeriodUseCase(tRepo, pRepo);

    await expect(
      useCase.execute({
        tournamentId: 't-1',
        validFrom: d('2026-02-01T00:00:00Z'),
        validTo: d('2026-01-01T00:00:00Z'),
        entryFeeAmount: 1000,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });

  it('lanza NOT_FOUND si el torneo no existe', async () => {
    const tRepo = makeTournamentRepo(false);
    const pRepo = makePricingRepo();
    const useCase = new CreatePricingPeriodUseCase(tRepo, pRepo);

    await expect(
      useCase.execute({
        tournamentId: 'missing',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T00:00:00Z'),
        entryFeeAmount: 1000,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});
