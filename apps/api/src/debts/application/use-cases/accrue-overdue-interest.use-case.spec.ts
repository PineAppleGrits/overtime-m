import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '../../../common/events';
import { IDebtContext } from '../ports/debt-context.port';
import { IDebtRepository } from '../ports/debt-repository.port';
import { AccrueOverdueInterestUseCase } from './accrue-overdue-interest.use-case';
import { CreateDebtInternalUseCase } from './create-debt-internal.use-case';

const buildDebt = (override: Record<string, unknown> = {}) => ({
  id: override.id ?? 'd-1',
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

describe('AccrueOverdueInterestUseCase (RN-028)', () => {
  const now = new Date('2026-05-04T03:01:00Z');

  function setup(opts: {
    candidates: ReturnType<typeof buildDebt>[];
    alreadyChargedFor?: string[];
  }) {
    const repo = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateState: jest.fn(),
      changeStatus: jest.fn(),
      applyPayment: jest.fn(),
      findOverdue: jest.fn().mockResolvedValue(opts.candidates),
      hasChildDebtForDay: jest
        .fn()
        .mockImplementation(async (filter) =>
          (opts.alreadyChargedFor ?? []).includes(filter.parentDebtId),
        ),
      findOutstandingForTeam: jest.fn(),
    } as unknown as jest.Mocked<IDebtRepository>;

    const ctx = {
      findTeamIdsForProfile: jest.fn().mockResolvedValue([]),
      resolveOverdueDailyAmountForDebt: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<IDebtContext>;

    const emitter = {
      emit: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<EventEmitter2>;

    // Simulación de CreateDebtInternalUseCase: capturamos los inputs
    const createUseCase = {
      execute: jest.fn().mockImplementation(async (input) => ({
        id: `child-${input.parentDebtId}-${(input.metadata as { dayKey: string }).dayKey}`,
        ...input,
        currentBalance: new Prisma.Decimal(input.originAmount),
        originAmount: new Prisma.Decimal(input.originAmount),
        status: 'APPROVED',
        currency: input.currency ?? 'ARS',
      })),
    } as unknown as jest.Mocked<CreateDebtInternalUseCase>;

    const useCase = new AccrueOverdueInterestUseCase(
      repo,
      ctx,
      createUseCase,
      emitter,
    );
    return { useCase, repo, ctx, createUseCase, emitter };
  }

  it('genera un OVERDUE_INTEREST por cada deuda vencida (happy path)', async () => {
    const { useCase, createUseCase, emitter } = setup({
      candidates: [
        buildDebt({ id: 'd-1', concept: 'Multa A' }),
        buildDebt({ id: 'd-2', concept: 'Multa B' }),
      ],
    });

    const result = await useCase.execute({ now });

    expect(result.scannedCount).toBe(2);
    expect(result.chargedCount).toBe(2);
    expect(result.skippedAlreadyChargedCount).toBe(0);

    expect(createUseCase.execute).toHaveBeenCalledTimes(2);
    const firstCall = createUseCase.execute.mock.calls[0]![0];
    expect(firstCall.type).toBe('OVERDUE_INTEREST');
    expect(firstCall.parentDebtId).toBe('d-1');
    expect(firstCall.originAmount).toBe(5000); // default RN-028
    expect((firstCall.metadata as { dayKey: string }).dayKey).toBe('2026-05-04');
    expect(firstCall.concept).toContain('Interés por día vencido');

    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.DEBT_OVERDUE_DETECTED,
      expect.objectContaining({ debtId: 'd-1' }),
    );
  });

  it('idempotencia — si ya hay child con dayKey de hoy, skippea', async () => {
    const { useCase, createUseCase } = setup({
      candidates: [buildDebt({ id: 'd-1' }), buildDebt({ id: 'd-2' })],
      alreadyChargedFor: ['d-1'],
    });

    const result = await useCase.execute({ now });

    expect(result.scannedCount).toBe(2);
    expect(result.chargedCount).toBe(1);
    expect(result.skippedAlreadyChargedCount).toBe(1);

    // Solo se creó la del segundo debt.
    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(createUseCase.execute.mock.calls[0]![0].parentDebtId).toBe('d-2');
  });

  it('si una falla, sigue con las demás y reporta el error', async () => {
    const { useCase, createUseCase } = setup({
      candidates: [buildDebt({ id: 'd-1' }), buildDebt({ id: 'd-2' })],
    });

    createUseCase.execute = jest
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error('DB fail');
      })
      .mockImplementationOnce(async (input) => ({
        id: 'child-2',
        ...input,
        currentBalance: new Prisma.Decimal(input.originAmount),
        originAmount: new Prisma.Decimal(input.originAmount),
        status: 'APPROVED',
        currency: input.currency ?? 'ARS',
      })) as any;

    const result = await useCase.execute({ now });

    expect(result.chargedCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.debtId).toBe('d-1');
  });

  it('usa el monto del context si está disponible', async () => {
    const { useCase, ctx, createUseCase } = setup({
      candidates: [buildDebt({ id: 'd-1' })],
    });
    ctx.resolveOverdueDailyAmountForDebt = jest
      .fn()
      .mockResolvedValue(7500) as any;

    await useCase.execute({ now });
    expect(createUseCase.execute.mock.calls[0]![0].originAmount).toBe(7500);
  });

  it('skippea tipos que no acumulan OVERDUE_INTEREST (defensivo)', async () => {
    // El repo ya excluye estos tipos, pero el use-case defensivamente
    // chequea por si bypass.
    const { useCase, createUseCase } = setup({
      candidates: [
        buildDebt({ id: 'd-1', type: 'OVERDUE_INTEREST' }),
        buildDebt({ id: 'd-2', type: 'REGISTRATION_FEE' }),
      ],
    });

    const result = await useCase.execute({ now });
    expect(result.chargedCount).toBe(0);
    expect(createUseCase.execute).not.toHaveBeenCalled();
  });
});
