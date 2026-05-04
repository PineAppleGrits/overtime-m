import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { IDebtRepository } from '../ports/debt-repository.port';
import { CreateDebtInternalUseCase } from './create-debt-internal.use-case';

const makeRepo = (): jest.Mocked<IDebtRepository> =>
  ({
    create: jest.fn().mockImplementation(async (input) => ({
      id: 'd-1',
      type: input.type,
      status: input.status ?? 'APPROVED',
      concept: input.concept,
      originAmount: input.originAmount,
      currentBalance: input.currentBalance,
      currency: input.currency,
      dueDate: input.dueDate,
      teamId: input.teamId,
      profileId: input.profileId,
      registrationId: input.registrationId ?? null,
      matchId: input.matchId ?? null,
      friendlyId: input.friendlyId ?? null,
      sanctionId: input.sanctionId ?? null,
      parentDebtId: input.parentDebtId ?? null,
      notes: input.notes,
      metadata: input.metadata ?? null,
      createdByProfileId: input.createdByProfileId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      payments: [],
      childDebts: [],
      audits: [],
    })),
    findById: jest.fn(),
    list: jest.fn(),
    updateState: jest.fn(),
    changeStatus: jest.fn(),
    applyPayment: jest.fn(),
    findOverdue: jest.fn(),
    hasChildDebtForDay: jest.fn(),
    findOutstandingForTeam: jest.fn(),
  }) as unknown as jest.Mocked<IDebtRepository>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('CreateDebtInternalUseCase', () => {
  const baseInput = {
    type: 'MISSED_MATCH_FINE' as const,
    concept: 'Multa partido X',
    originAmount: 10000,
    dueDate: new Date('2026-06-01T00:00:00Z'),
    teamId: 'team-A',
    createdByProfileId: 'admin-1',
  };

  it('crea la deuda con currentBalance = originAmount y emite debt.created', async () => {
    const repo = makeRepo();
    const emitter = makeEmitter();
    const useCase = new CreateDebtInternalUseCase(repo, emitter);

    const debt = await useCase.execute(baseInput);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MISSED_MATCH_FINE',
        teamId: 'team-A',
        status: 'APPROVED',
      }),
    );
    const createCall = repo.create.mock.calls[0]![0];
    expect(createCall.originAmount.toString()).toBe('10000');
    expect(createCall.currentBalance.toString()).toBe('10000');

    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.DEBT_CREATED,
      expect.objectContaining({
        debtId: 'd-1',
        type: 'MISSED_MATCH_FINE',
        teamId: 'team-A',
      }),
    );
    expect(debt.id).toBe('d-1');
  });

  it('falla si no hay teamId ni profileId', async () => {
    const useCase = new CreateDebtInternalUseCase(makeRepo(), makeEmitter());
    await expect(
      useCase.execute({
        ...baseInput,
        teamId: undefined,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });

  it('falla si originAmount <= 0', async () => {
    const useCase = new CreateDebtInternalUseCase(makeRepo(), makeEmitter());
    await expect(
      useCase.execute({
        ...baseInput,
        originAmount: 0,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it('acepta strings y Decimal en originAmount', async () => {
    const repo = makeRepo();
    const useCase = new CreateDebtInternalUseCase(repo, makeEmitter());

    await useCase.execute({ ...baseInput, originAmount: '15000.75' });
    expect(repo.create.mock.calls[0]![0].originAmount.toString()).toBe(
      '15000.75',
    );

    await useCase.execute({
      ...baseInput,
      originAmount: new Prisma.Decimal('25000.10'),
    });
    expect(repo.create.mock.calls[1]![0].originAmount.toString()).toBe(
      '25000.1',
    );
  });

  it('default currency = ARS', async () => {
    const repo = makeRepo();
    const useCase = new CreateDebtInternalUseCase(repo, makeEmitter());
    await useCase.execute(baseInput);
    expect(repo.create.mock.calls[0]![0].currency).toBe('ARS');
  });
});
