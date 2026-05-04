import { Prisma } from '@prisma/client';
import { IDebtRepository } from '../ports/debt-repository.port';
import { CheckTeamOutstandingDebtsUseCase } from './check-team-outstanding-debts.use-case';

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

const makeRepo = (
  outstanding: ReturnType<typeof buildDebt>[],
): jest.Mocked<IDebtRepository> =>
  ({
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    updateState: jest.fn(),
    changeStatus: jest.fn(),
    applyPayment: jest.fn(),
    findOverdue: jest.fn(),
    hasChildDebtForDay: jest.fn(),
    findOutstandingForTeam: jest.fn().mockResolvedValue(outstanding),
  }) as unknown as jest.Mocked<IDebtRepository>;

describe('CheckTeamOutstandingDebtsUseCase (RN-053 + DP-006)', () => {
  it('hasOutstanding=false si no hay deudas vencidas', async () => {
    const repo = makeRepo([]);
    const useCase = new CheckTeamOutstandingDebtsUseCase(repo);
    const result = await useCase.execute({ teamId: 'team-A' });
    expect(result.hasOutstanding).toBe(false);
    expect(result.debts).toHaveLength(0);
  });

  it('hasOutstanding=true si hay al menos una deuda vencida', async () => {
    const repo = makeRepo([buildDebt({ id: 'd-1' })]);
    const useCase = new CheckTeamOutstandingDebtsUseCase(repo);
    const result = await useCase.execute({ teamId: 'team-A' });
    expect(result.hasOutstanding).toBe(true);
    expect(result.debts).toHaveLength(1);
  });

  describe('DP-006 — allowFiftyPercentRule', () => {
    it('por defecto (false), bloquea aunque la deuda esté al 50% pagada', async () => {
      const repo = makeRepo([
        buildDebt({
          id: 'd-1',
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('5000'),
        }),
      ]);
      const useCase = new CheckTeamOutstandingDebtsUseCase(repo);
      const result = await useCase.execute({ teamId: 'team-A' });
      expect(result.hasOutstanding).toBe(true);
    });

    it('con flag=true, deudas con balance ≤ 50% del origen NO bloquean', async () => {
      const repo = makeRepo([
        buildDebt({
          id: 'd-1',
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('5000'),
        }),
      ]);
      const useCase = new CheckTeamOutstandingDebtsUseCase(repo);
      const result = await useCase.execute({
        teamId: 'team-A',
        allowFiftyPercentRule: true,
      });
      expect(result.hasOutstanding).toBe(false);
    });

    it('con flag=true, deuda al 60% del origen (40% pagada) sí bloquea', async () => {
      const repo = makeRepo([
        buildDebt({
          id: 'd-1',
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('6000'),
        }),
      ]);
      const useCase = new CheckTeamOutstandingDebtsUseCase(repo);
      const result = await useCase.execute({
        teamId: 'team-A',
        allowFiftyPercentRule: true,
      });
      expect(result.hasOutstanding).toBe(true);
    });

    it('con flag=true, mezcla — solo cuenta la que NO superó el 50%', async () => {
      const repo = makeRepo([
        buildDebt({
          id: 'd-pagada-mucho',
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('3000'), // 70% pagada → NO bloquea
        }),
        buildDebt({
          id: 'd-pagada-poco',
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('8000'), // 20% pagada → bloquea
        }),
      ]);
      const useCase = new CheckTeamOutstandingDebtsUseCase(repo);
      const result = await useCase.execute({
        teamId: 'team-A',
        allowFiftyPercentRule: true,
      });
      expect(result.hasOutstanding).toBe(true);
      expect(result.debts).toHaveLength(1);
      expect(result.debts[0]!.id).toBe('d-pagada-poco');
    });
  });
});
