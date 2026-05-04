import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { IDebtRepository } from '../ports/debt-repository.port';
import { ApplyPaymentToDebtUseCase } from './apply-payment-to-debt.use-case';

const buildDebt = (override: Record<string, unknown> = {}) => ({
  id: 'd-1',
  type: 'MISSED_MATCH_FINE',
  status: 'APPROVED',
  concept: 'Multa',
  originAmount: new Prisma.Decimal('10000'),
  currentBalance: new Prisma.Decimal('10000'),
  currency: 'ARS',
  dueDate: new Date('2026-04-01T00:00:00Z'),
  teamId: 'team-A',
  profileId: null,
  registrationId: null,
  matchId: null,
  friendlyId: null,
  sanctionId: null,
  parentDebtId: null,
  notes: null,
  metadata: null,
  createdByProfileId: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  payments: [],
  childDebts: [],
  audits: [],
  ...override,
});

const makeRepo = (
  initial: ReturnType<typeof buildDebt>,
): jest.Mocked<IDebtRepository> => {
  const state = { ...initial };
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(state),
    list: jest.fn(),
    updateState: jest.fn(),
    changeStatus: jest.fn(),
    applyPayment: jest
      .fn()
      .mockImplementation(async (id: string, amount: Prisma.Decimal) => {
        const newBalance = state.currentBalance.minus(amount);
        const fullyPaid = newBalance.lessThanOrEqualTo(0);
        state.currentBalance = fullyPaid ? new Prisma.Decimal(0) : newBalance;
        state.status = fullyPaid ? 'PAID' : 'PARTIALLY_PAID';
        return { ...state };
      }),
    findOverdue: jest.fn(),
    hasChildDebtForDay: jest.fn(),
    findOutstandingForTeam: jest.fn(),
  } as unknown as jest.Mocked<IDebtRepository>;
};

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('ApplyPaymentToDebtUseCase', () => {
  it('pago parcial → status=PARTIALLY_PAID y emite debt.partially.paid', async () => {
    const debt = buildDebt({ currentBalance: new Prisma.Decimal('10000') });
    const repo = makeRepo(debt);
    const emitter = makeEmitter();
    const useCase = new ApplyPaymentToDebtUseCase(repo, emitter);

    const result = await useCase.execute({
      debtId: 'd-1',
      amount: 3000,
      paidByProfileId: 'admin-1',
    });

    expect(result.status).toBe('PARTIALLY_PAID');
    expect(result.currentBalance.toString()).toBe('7000');
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.DEBT_PARTIALLY_PAID,
      expect.objectContaining({
        debtId: 'd-1',
        paidAmount: 3000,
        remainingBalance: 7000,
      }),
    );
  });

  it('pago total → status=PAID y emite debt.fully.paid', async () => {
    const debt = buildDebt({ currentBalance: new Prisma.Decimal('10000') });
    const repo = makeRepo(debt);
    const emitter = makeEmitter();
    const useCase = new ApplyPaymentToDebtUseCase(repo, emitter);

    const result = await useCase.execute({
      debtId: 'd-1',
      amount: 10000,
      paidByProfileId: 'admin-1',
    });

    expect(result.status).toBe('PAID');
    expect(result.currentBalance.toString()).toBe('0');
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.DEBT_FULLY_PAID,
      expect.objectContaining({ debtId: 'd-1' }),
    );
  });

  it('amount=0 lanza VALIDATION_FAILED', async () => {
    const debt = buildDebt();
    const useCase = new ApplyPaymentToDebtUseCase(makeRepo(debt), makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-1',
        amount: 0,
        paidByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });

  it('amount > balance lanza DEBT_AMOUNT_EXCEEDS_BALANCE', async () => {
    const debt = buildDebt({ currentBalance: new Prisma.Decimal('5000') });
    const useCase = new ApplyPaymentToDebtUseCase(makeRepo(debt), makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-1',
        amount: 10000,
        paidByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_AMOUNT_EXCEEDS_BALANCE });
  });

  it('debt en PAID lanza DEBT_ALREADY_PAID', async () => {
    const debt = buildDebt({
      status: 'PAID',
      currentBalance: new Prisma.Decimal('0'),
    });
    const useCase = new ApplyPaymentToDebtUseCase(makeRepo(debt), makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-1',
        amount: 100,
        paidByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_ALREADY_PAID });
  });

  it('debt en CANCELLED lanza DEBT_INVALID_STATUS_TRANSITION', async () => {
    const debt = buildDebt({ status: 'CANCELLED' });
    const useCase = new ApplyPaymentToDebtUseCase(makeRepo(debt), makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-1',
        amount: 100,
        paidByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_INVALID_STATUS_TRANSITION });
  });

  it('debtId inexistente lanza NOT_FOUND', async () => {
    const debt = buildDebt();
    const repo = makeRepo(debt);
    repo.findById = jest.fn().mockResolvedValue(null);
    const useCase = new ApplyPaymentToDebtUseCase(repo, makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-999',
        amount: 100,
        paidByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});
