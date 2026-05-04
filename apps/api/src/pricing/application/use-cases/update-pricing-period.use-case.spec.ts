import { ErrorCode } from '../../../common/errors';
import { IPricingRepository, PricingRecord } from '../ports/pricing-repository.port';
import { UpdatePricingPeriodUseCase } from './update-pricing-period.use-case';

const d = (iso: string): Date => new Date(iso);

const makeRepo = (
  current: PricingRecord,
  siblings: PricingRecord[],
): jest.Mocked<IPricingRepository> =>
  ({
    findById: jest.fn().mockResolvedValue(current),
    listByTournament: jest.fn().mockResolvedValue(siblings),
    create: jest.fn(),
    update: jest.fn().mockImplementation(async (id, input) => ({
      ...current,
      ...input,
      paymentMethod:
        input.paymentMethod === undefined
          ? current.paymentMethod
          : input.paymentMethod,
      id,
      updatedAt: new Date(),
    })),
    delete: jest.fn(),
    findRawById: jest.fn(),
  }) as unknown as jest.Mocked<IPricingRepository>;

const baseRecord: PricingRecord = {
  id: 'p-1',
  tournamentId: 't-1',
  validFrom: d('2026-01-01T00:00:00Z'),
  validTo: d('2026-01-31T00:00:00Z'),
  entryFeeAmount: 50000,
  currency: 'ARS',
  paymentMethod: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UpdatePricingPeriodUseCase', () => {
  it('actualiza monto sin tocar fechas ni método', async () => {
    const repo = makeRepo(baseRecord, [baseRecord]);
    const useCase = new UpdatePricingPeriodUseCase(repo);

    const result = await useCase.execute({
      pricingId: 'p-1',
      entryFeeAmount: 60000,
    });

    expect(result.entryFeeAmount).toBe(60000);
    expect(repo.update).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({
        entryFeeAmount: 60000,
        validFrom: undefined,
        validTo: undefined,
      }),
    );
  });

  it('cambia el método y revalida overlap', async () => {
    const cashSibling: PricingRecord = {
      ...baseRecord,
      id: 'p-cash',
      paymentMethod: 'cash',
    };
    const repo = makeRepo(baseRecord, [baseRecord, cashSibling]);
    const useCase = new UpdatePricingPeriodUseCase(repo);

    // Cambiar baseRecord (null) a 'cash' chocaría con 'p-cash'.
    await expect(
      useCase.execute({ pricingId: 'p-1', paymentMethod: 'cash' }),
    ).rejects.toMatchObject({ code: ErrorCode.PRICING_PERIOD_OVERLAP });
  });

  it('PRICING_PERIOD_NOT_FOUND si no existe', async () => {
    const repo = makeRepo(baseRecord, [baseRecord]);
    repo.findById.mockResolvedValue(null);
    const useCase = new UpdatePricingPeriodUseCase(repo);

    await expect(
      useCase.execute({ pricingId: 'missing', entryFeeAmount: 1 }),
    ).rejects.toMatchObject({ code: ErrorCode.PRICING_PERIOD_NOT_FOUND });
  });

  it('rechaza fechas inválidas', async () => {
    const repo = makeRepo(baseRecord, [baseRecord]);
    const useCase = new UpdatePricingPeriodUseCase(repo);
    await expect(
      useCase.execute({
        pricingId: 'p-1',
        validFrom: d('2026-02-10T00:00:00Z'),
        validTo: d('2026-02-01T00:00:00Z'),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });
});
