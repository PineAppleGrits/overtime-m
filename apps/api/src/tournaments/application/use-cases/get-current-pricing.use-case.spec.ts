import { GetCurrentPricingUseCase } from './get-current-pricing.use-case';
import { IPricingRepository } from '../ports/pricing-repository.port';
import { ITournamentRepository } from '../ports/tournament-repository.port';

const d = (iso: string): Date => new Date(iso);

const makeTournamentRepo = (): jest.Mocked<ITournamentRepository> =>
  ({
    findById: jest.fn().mockResolvedValue({ id: 't-1' } as never),
    findBySlug: jest.fn(),
    findBySportId: jest.fn(),
    slugExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  }) as jest.Mocked<ITournamentRepository>;

const makePricingRepo = (
  periods: Array<{ id: string; validFrom: Date; validTo: Date }>,
): jest.Mocked<IPricingRepository> =>
  ({
    listByTournament: jest.fn().mockResolvedValue(periods as never),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<IPricingRepository>;

describe('GetCurrentPricingUseCase', () => {
  it('devuelve el período vigente', async () => {
    const useCase = new GetCurrentPricingUseCase(
      makeTournamentRepo(),
      makePricingRepo([
        {
          id: 'p-1',
          validFrom: d('2026-01-01T00:00:00Z'),
          validTo: d('2026-01-31T00:00:00Z'),
        },
        {
          id: 'p-2',
          validFrom: d('2026-02-01T00:00:00Z'),
          validTo: d('2026-02-28T00:00:00Z'),
        },
      ]),
    );

    const result = await useCase.execute('t-1', d('2026-02-15T00:00:00Z'));
    expect(result?.id).toBe('p-2');
  });

  it('devuelve null si no hay período vigente', async () => {
    const useCase = new GetCurrentPricingUseCase(
      makeTournamentRepo(),
      makePricingRepo([
        {
          id: 'p-1',
          validFrom: d('2026-01-01T00:00:00Z'),
          validTo: d('2026-01-31T00:00:00Z'),
        },
      ]),
    );

    const result = await useCase.execute('t-1', d('2026-06-15T00:00:00Z'));
    expect(result).toBeNull();
  });
});
