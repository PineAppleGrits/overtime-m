import { BusinessError, ErrorCode } from '../../../common/errors';
import { IPricingRepository } from '../ports/pricing-repository.port';
import { UpdatePricingPeriodUseCase } from './update-pricing-period.use-case';

const d = (iso: string): Date => new Date(iso);

const makeRepo = (
  current: { id: string; tournamentId: string; validFrom: Date; validTo: Date },
  siblings: Array<{ id: string; validFrom: Date; validTo: Date }>,
): jest.Mocked<IPricingRepository> =>
  ({
    findById: jest.fn().mockResolvedValue(current as never),
    listByTournament: jest.fn().mockResolvedValue(siblings as never),
    create: jest.fn(),
    update: jest
      .fn()
      .mockImplementation(async (id: string, input: Record<string, unknown>) => ({
        ...current,
        ...input,
        id,
        updatedAt: new Date(),
      })),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<IPricingRepository>;

describe('UpdatePricingPeriodUseCase', () => {
  const baseCurrent = {
    id: 'p-1',
    tournamentId: 't-1',
    validFrom: d('2026-01-01T00:00:00Z'),
    validTo: d('2026-01-31T00:00:00Z'),
  };

  it('permite actualizar sin cambiar fechas', async () => {
    const repo = makeRepo(baseCurrent, [baseCurrent]);
    const useCase = new UpdatePricingPeriodUseCase(repo);
    const updated = await useCase.execute({
      pricingId: 'p-1',
      entryFeeAmount: 60000,
    });
    expect(updated).toBeDefined();
    expect(repo.update).toHaveBeenCalled();
  });

  it('rechaza si el cambio de fechas crea overlap con otro período', async () => {
    const repo = makeRepo(baseCurrent, [
      baseCurrent,
      {
        id: 'p-2',
        validFrom: d('2026-02-15T00:00:00Z'),
        validTo: d('2026-02-28T00:00:00Z'),
      },
    ]);
    const useCase = new UpdatePricingPeriodUseCase(repo);

    await expect(
      useCase.execute({
        pricingId: 'p-1',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-02-20T00:00:00Z'),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.PRICING_PERIOD_OVERLAP });
  });

  it('lanza PRICING_PERIOD_NOT_FOUND si el id no existe', async () => {
    const repo = makeRepo(baseCurrent, [baseCurrent]);
    repo.findById.mockResolvedValue(null);
    const useCase = new UpdatePricingPeriodUseCase(repo);
    await expect(
      useCase.execute({ pricingId: 'missing', entryFeeAmount: 1 }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it('rechaza fechas inválidas (from >= to)', async () => {
    const repo = makeRepo(baseCurrent, [baseCurrent]);
    const useCase = new UpdatePricingPeriodUseCase(repo);
    await expect(
      useCase.execute({
        pricingId: 'p-1',
        validFrom: d('2026-02-01T00:00:00Z'),
        validTo: d('2026-01-01T00:00:00Z'),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });
});
