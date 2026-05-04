import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { IDebtRepository } from '../ports/debt-repository.port';
import { ChangeDebtStatusUseCase } from './change-debt-status.use-case';

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

const makeRepo = (debt: ReturnType<typeof buildDebt>) =>
  ({
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(debt),
    list: jest.fn(),
    updateState: jest.fn(),
    changeStatus: jest
      .fn()
      .mockImplementation(async (id: string, _from, to) => ({
        ...debt,
        status: to,
      })),
    applyPayment: jest.fn(),
    findOverdue: jest.fn(),
    hasChildDebtForDay: jest.fn(),
    findOutstandingForTeam: jest.fn(),
  }) as unknown as jest.Mocked<IDebtRepository>;

const makeEmitter = () =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('ChangeDebtStatusUseCase (RN-031)', () => {
  it('APPROVED → DELETED_BY_ERROR funciona y crea audit', async () => {
    const debt = buildDebt({ status: 'APPROVED' });
    const repo = makeRepo(debt);
    const useCase = new ChangeDebtStatusUseCase(repo, makeEmitter());

    const result = await useCase.execute({
      debtId: 'd-1',
      toStatus: 'DELETED_BY_ERROR',
      reason: 'cargado por error',
      byProfileId: 'admin-1',
    });

    expect(result.status).toBe('DELETED_BY_ERROR');
    expect(repo.changeStatus).toHaveBeenCalledWith(
      'd-1',
      'APPROVED',
      'DELETED_BY_ERROR',
      'admin-1',
      'cargado por error',
    );
  });

  it('APPROVED → CANCELLED emite debt.cancelled', async () => {
    const debt = buildDebt({ status: 'APPROVED' });
    const repo = makeRepo(debt);
    const emitter = makeEmitter();
    const useCase = new ChangeDebtStatusUseCase(repo, emitter);

    await useCase.execute({
      debtId: 'd-1',
      toStatus: 'CANCELLED',
      reason: 'seguro reusado',
      byProfileId: 'admin-1',
    });

    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.DEBT_CANCELLED,
      expect.objectContaining({ debtId: 'd-1', reason: 'seguro reusado' }),
    );
  });

  it('PARTIALLY_PAID → CANCELLED es admitido', async () => {
    const debt = buildDebt({ status: 'PARTIALLY_PAID' });
    const repo = makeRepo(debt);
    const useCase = new ChangeDebtStatusUseCase(repo, makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-1',
        toStatus: 'CANCELLED',
        byProfileId: 'admin-1',
      }),
    ).resolves.toBeDefined();
  });

  it('PARTIALLY_PAID → DELETED_BY_ERROR rechaza con DEBT_INVALID_STATUS_TRANSITION', async () => {
    const debt = buildDebt({ status: 'PARTIALLY_PAID' });
    const repo = makeRepo(debt);
    const useCase = new ChangeDebtStatusUseCase(repo, makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-1',
        toStatus: 'DELETED_BY_ERROR',
        byProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_INVALID_STATUS_TRANSITION });
  });

  it('admin → PAID NO admitido (lo dispara applyPayment)', async () => {
    const debt = buildDebt({ status: 'APPROVED' });
    const repo = makeRepo(debt);
    const useCase = new ChangeDebtStatusUseCase(repo, makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-1',
        toStatus: 'PAID',
        byProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_INVALID_STATUS_TRANSITION });
  });

  it('debt no encontrada lanza NOT_FOUND', async () => {
    const debt = buildDebt();
    const repo = makeRepo(debt);
    repo.findById = jest.fn().mockResolvedValue(null);
    const useCase = new ChangeDebtStatusUseCase(repo, makeEmitter());
    await expect(
      useCase.execute({
        debtId: 'd-x',
        toStatus: 'CANCELLED',
        byProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});
