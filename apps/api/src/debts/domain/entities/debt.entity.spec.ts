import { Prisma } from '@prisma/client';
import { Debt, DebtState } from './debt.entity';

const baseState = (override: Partial<DebtState> = {}): DebtState => ({
  id: 'd-1',
  type: 'MISSED_MATCH_FINE',
  status: 'APPROVED',
  concept: 'Multa por no presentarse',
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
  createdAt: new Date('2026-03-25T10:00:00Z'),
  updatedAt: new Date('2026-03-25T10:00:00Z'),
  deletedAt: null,
  ...override,
});

describe('Debt entity', () => {
  describe('isActive', () => {
    it('APPROVED y PARTIALLY_PAID son activos', () => {
      expect(Debt.fromState(baseState({ status: 'APPROVED' })).isActive()).toBe(
        true,
      );
      expect(
        Debt.fromState(baseState({ status: 'PARTIALLY_PAID' })).isActive(),
      ).toBe(true);
    });

    it('PAID no es activo', () => {
      expect(Debt.fromState(baseState({ status: 'PAID' })).isActive()).toBe(
        false,
      );
    });
  });

  describe('isOverdue', () => {
    it('true si dueDate < now y balance > 0 y está activa', () => {
      const debt = Debt.fromState(
        baseState({ dueDate: new Date('2026-04-01T00:00:00Z') }),
      );
      const now = new Date('2026-05-01T00:00:00Z');
      expect(debt.isOverdue(now)).toBe(true);
    });

    it('false si dueDate en el futuro', () => {
      const debt = Debt.fromState(
        baseState({ dueDate: new Date('2026-06-01T00:00:00Z') }),
      );
      const now = new Date('2026-05-01T00:00:00Z');
      expect(debt.isOverdue(now)).toBe(false);
    });

    it('false si está PAID aunque dueDate haya pasado', () => {
      const debt = Debt.fromState(
        baseState({
          status: 'PAID',
          currentBalance: new Prisma.Decimal('0'),
          dueDate: new Date('2026-04-01T00:00:00Z'),
        }),
      );
      const now = new Date('2026-05-01T00:00:00Z');
      expect(debt.isOverdue(now)).toBe(false);
    });

    it('false si balance es 0', () => {
      const debt = Debt.fromState(
        baseState({
          currentBalance: new Prisma.Decimal('0'),
          dueDate: new Date('2026-04-01T00:00:00Z'),
        }),
      );
      expect(debt.isOverdue(new Date('2026-05-01T00:00:00Z'))).toBe(false);
    });
  });

  describe('isHalfOrMorePaid (DP-006)', () => {
    it('balance al 50% del origen → true', () => {
      const debt = Debt.fromState(
        baseState({
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('5000'),
        }),
      );
      expect(debt.isHalfOrMorePaid()).toBe(true);
    });

    it('balance al 60% del origen (40% pagado) → false', () => {
      const debt = Debt.fromState(
        baseState({
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('6000'),
        }),
      );
      expect(debt.isHalfOrMorePaid()).toBe(false);
    });

    it('balance al 30% del origen (70% pagado) → true', () => {
      const debt = Debt.fromState(
        baseState({
          originAmount: new Prisma.Decimal('10000'),
          currentBalance: new Prisma.Decimal('3000'),
        }),
      );
      expect(debt.isHalfOrMorePaid()).toBe(true);
    });

    it('originAmount = 0 → false (defensivo)', () => {
      const debt = Debt.fromState(
        baseState({
          originAmount: new Prisma.Decimal('0'),
          currentBalance: new Prisma.Decimal('0'),
        }),
      );
      expect(debt.isHalfOrMorePaid()).toBe(false);
    });
  });

  describe('applyPayment', () => {
    it('pago menor al balance → PARTIALLY_PAID', () => {
      const debt = Debt.fromState(
        baseState({
          currentBalance: new Prisma.Decimal('10000'),
        }),
      );
      const result = debt.applyPayment(new Prisma.Decimal('3000'));
      expect(result.fullyPaid).toBe(false);
      expect(result.newStatus).toBe('PARTIALLY_PAID');
      expect(result.newBalance.toString()).toBe('7000');
    });

    it('pago igual al balance → PAID', () => {
      const debt = Debt.fromState(
        baseState({
          currentBalance: new Prisma.Decimal('10000'),
        }),
      );
      const result = debt.applyPayment(new Prisma.Decimal('10000'));
      expect(result.fullyPaid).toBe(true);
      expect(result.newStatus).toBe('PAID');
      expect(result.newBalance.toString()).toBe('0');
    });

    it('pago decimal exacto preserva precisión', () => {
      const debt = Debt.fromState(
        baseState({
          currentBalance: new Prisma.Decimal('10000.50'),
        }),
      );
      const result = debt.applyPayment(new Prisma.Decimal('5000.25'));
      expect(result.newBalance.toString()).toBe('5000.25');
      expect(result.fullyPaid).toBe(false);
    });
  });

  describe('canAdminTransitionTo', () => {
    it('admite las transiciones admin de RN-031', () => {
      const debt = Debt.fromState(baseState({ status: 'APPROVED' }));
      expect(debt.canAdminTransitionTo('DELETED_BY_ERROR')).toBe(true);
      expect(debt.canAdminTransitionTo('DELETED_WITH_RECORD')).toBe(true);
      expect(debt.canAdminTransitionTo('CANCELLED')).toBe(true);
    });

    it('no admite admin → PAID (lo dispara applyPayment)', () => {
      const debt = Debt.fromState(baseState({ status: 'APPROVED' }));
      expect(debt.canAdminTransitionTo('PAID')).toBe(false);
    });
  });
});
