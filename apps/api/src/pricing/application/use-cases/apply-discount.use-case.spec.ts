import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Debt } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events/domain-events';
import { IDiscountRepository } from '../ports/discount-repository.port';
import { ApplyDiscountUseCase } from './apply-discount.use-case';

const fakeDebt = (overrides: Partial<Debt> = {}): Debt =>
  ({
    id: 'd-1',
    type: 'OTHER_MANUAL',
    status: 'APPROVED',
    concept: 'Descuento por error de cobro',
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

const makeRepo = (): jest.Mocked<IDiscountRepository> =>
  ({
    create: jest.fn().mockResolvedValue(fakeDebt()),
    findById: jest.fn(),
    list: jest.fn(),
    cancel: jest.fn(),
  }) as unknown as jest.Mocked<IDiscountRepository>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn(),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('ApplyDiscountUseCase', () => {
  it('crea un descuento y emite DEBT_CREATED', async () => {
    const repo = makeRepo();
    const emitter = makeEmitter();
    const useCase = new ApplyDiscountUseCase(repo, emitter);

    const result = await useCase.execute({
      teamId: 't-1',
      amount: 1000,
      concept: 'Descuento por error de cobro',
      createdByProfileId: 'admin-1',
    });

    expect(result.id).toBe('d-1');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 't-1', amount: 1000 }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.DEBT_CREATED,
      expect.objectContaining({
        debtId: 'd-1',
        teamId: 't-1',
        amount: 1000,
      }),
    );
  });

  it('rechaza monto cero o negativo', async () => {
    const useCase = new ApplyDiscountUseCase(makeRepo(), makeEmitter());

    await expect(
      useCase.execute({
        teamId: 't-1',
        amount: 0,
        concept: 'X',
        createdByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DISCOUNT_AMOUNT_INVALID });

    await expect(
      useCase.execute({
        teamId: 't-1',
        amount: -100,
        concept: 'X',
        createdByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DISCOUNT_AMOUNT_INVALID });
  });

  it('rechaza más de 2 decimales', async () => {
    const useCase = new ApplyDiscountUseCase(makeRepo(), makeEmitter());

    await expect(
      useCase.execute({
        teamId: 't-1',
        amount: 100.123,
        concept: 'X',
        createdByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DISCOUNT_AMOUNT_INVALID });
  });
});
