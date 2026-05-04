import type { Debt } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { IDiscountRepository } from '../ports/discount-repository.port';
import { CancelDiscountUseCase } from './cancel-discount.use-case';

const fakeDebt = (overrides: Partial<Debt> = {}): Debt =>
  ({
    id: 'd-1',
    type: 'OTHER_MANUAL',
    status: 'APPROVED',
    concept: 'Descuento test',
    originAmount: -1000,
    currentBalance: -1000,
    currency: 'ARS',
    dueDate: new Date(),
    teamId: 't-1',
    profileId: null,
    registrationId: null,
    matchId: null,
    friendlyId: null,
    sanctionId: null,
    parentDebtId: null,
    notes: null,
    metadata: { kind: 'DISCOUNT' },
    createdByProfileId: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as unknown as Debt;

const makeRepo = (
  overrides: Partial<jest.Mocked<IDiscountRepository>> = {},
): jest.Mocked<IDiscountRepository> =>
  ({
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(fakeDebt()),
    list: jest.fn(),
    cancel: jest
      .fn()
      .mockImplementation(async (id) =>
        fakeDebt({ id, status: 'CANCELLED' }),
      ),
    ...overrides,
  }) as unknown as jest.Mocked<IDiscountRepository>;

describe('CancelDiscountUseCase', () => {
  it('cancela un descuento existente', async () => {
    const repo = makeRepo();
    const useCase = new CancelDiscountUseCase(repo);

    const result = await useCase.execute({
      discountId: 'd-1',
      cancelledByProfileId: 'admin-1',
    });

    expect(result.status).toBe('CANCELLED');
    expect(repo.cancel).toHaveBeenCalledWith('d-1', 'admin-1', undefined);
  });

  it('lanza DISCOUNT_NOT_FOUND si no existe', async () => {
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IDiscountRepository>);
    const useCase = new CancelDiscountUseCase(repo);

    await expect(
      useCase.execute({
        discountId: 'missing',
        cancelledByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DISCOUNT_NOT_FOUND });
  });

  it('lanza DISCOUNT_NOT_FOUND si la deuda no tiene metadata.kind=DISCOUNT', async () => {
    const repo = makeRepo({
      findById: jest
        .fn()
        .mockResolvedValue(fakeDebt({ metadata: { kind: 'OTHER' } })),
    } as unknown as jest.Mocked<IDiscountRepository>);
    const useCase = new CancelDiscountUseCase(repo);

    await expect(
      useCase.execute({
        discountId: 'd-1',
        cancelledByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DISCOUNT_NOT_FOUND });
  });

  it('lanza DISCOUNT_ALREADY_CANCELLED si ya estaba cancelado', async () => {
    const repo = makeRepo({
      findById: jest
        .fn()
        .mockResolvedValue(fakeDebt({ status: 'CANCELLED' })),
    } as unknown as jest.Mocked<IDiscountRepository>);
    const useCase = new CancelDiscountUseCase(repo);

    await expect(
      useCase.execute({
        discountId: 'd-1',
        cancelledByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DISCOUNT_ALREADY_CANCELLED });
  });
});
