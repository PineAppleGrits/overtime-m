import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { IDebtContext } from '../ports/debt-context.port';
import { IDebtRepository } from '../ports/debt-repository.port';
import { AccrueLatePaymentDailyChargeUseCase } from './accrue-late-payment-daily-charge.use-case';
import { CreateDebtInternalUseCase } from './create-debt-internal.use-case';

const buildDebt = (override: Record<string, unknown> = {}) => ({
  id: override.id ?? 'd-1',
  type: 'REGISTRATION_FEE',
  status: 'APPROVED',
  concept: 'Inscripción torneo X',
  originAmount: new Prisma.Decimal('20000'),
  currentBalance: new Prisma.Decimal('20000'),
  currency: 'ARS',
  dueDate: new Date('2026-04-30T00:00:00Z'),
  teamId: 'team-A',
  profileId: null,
  registrationId: 'reg-1',
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

describe('AccrueLatePaymentDailyChargeUseCase (RN-029)', () => {
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

    const createUseCase = {
      execute: jest.fn().mockImplementation(async (input) => ({
        id: `child-${input.parentDebtId}`,
        ...input,
        currentBalance: new Prisma.Decimal(input.originAmount),
        originAmount: new Prisma.Decimal(input.originAmount),
        status: 'APPROVED',
        currency: input.currency ?? 'ARS',
      })),
    } as unknown as jest.Mocked<CreateDebtInternalUseCase>;

    const useCase = new AccrueLatePaymentDailyChargeUseCase(
      repo,
      ctx,
      createUseCase,
      emitter,
    );
    return { useCase, repo, ctx, createUseCase, emitter };
  }

  it('genera un LATE_PAYMENT_DAILY_CHARGE por cada deuda de inscripción/seguro vencida', async () => {
    const { useCase, createUseCase, repo } = setup({
      candidates: [
        buildDebt({ id: 'd-reg', type: 'REGISTRATION_FEE' }),
        buildDebt({ id: 'd-ins', type: 'INSURANCE' }),
      ],
    });

    const result = await useCase.execute({ now });
    expect(result.chargedCount).toBe(2);

    expect(repo.findOverdue).toHaveBeenCalledWith(
      expect.objectContaining({
        types: ['REGISTRATION_FEE', 'INSURANCE'],
      }),
    );

    expect(createUseCase.execute).toHaveBeenCalledTimes(2);
    expect(createUseCase.execute.mock.calls[0]![0].type).toBe(
      'LATE_PAYMENT_DAILY_CHARGE',
    );
    expect((createUseCase.execute.mock.calls[0]![0].metadata as { dayKey: string }).dayKey).toBe(
      '2026-05-04',
    );
  });

  it('idempotencia — skippea si ya hay child con dayKey de hoy', async () => {
    const { useCase, createUseCase } = setup({
      candidates: [buildDebt({ id: 'd-1' })],
      alreadyChargedFor: ['d-1'],
    });
    const result = await useCase.execute({ now });
    expect(result.chargedCount).toBe(0);
    expect(result.skippedAlreadyChargedCount).toBe(1);
    expect(createUseCase.execute).not.toHaveBeenCalled();
  });
});
