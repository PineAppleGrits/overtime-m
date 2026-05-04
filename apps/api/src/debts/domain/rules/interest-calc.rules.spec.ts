import {
  buildInterestChargeDescriptor,
  debtTypeAccruesLatePaymentCharge,
  debtTypeAccruesOverdueInterest,
  startOfUtcDay,
  toDayKey,
} from './interest-calc.rules';

describe('Interest calc rules (RN-028 / RN-029)', () => {
  describe('toDayKey', () => {
    it('formatea YYYY-MM-DD con padding', () => {
      expect(toDayKey(new Date('2026-05-04T03:01:00Z'))).toBe('2026-05-04');
      expect(toDayKey(new Date('2026-01-09T23:59:00Z'))).toBe('2026-01-09');
    });

    it('usa UTC consistentemente', () => {
      // Mismo instante, distintos formatos — debe respetar UTC.
      const d1 = new Date('2026-05-04T00:00:00Z');
      const d2 = new Date(Date.UTC(2026, 4, 4, 0, 0, 0, 0));
      expect(toDayKey(d1)).toBe(toDayKey(d2));
    });
  });

  describe('startOfUtcDay', () => {
    it('devuelve 00:00 UTC del mismo día', () => {
      const start = startOfUtcDay(new Date('2026-05-04T15:30:00Z'));
      expect(start.toISOString()).toBe('2026-05-04T00:00:00.000Z');
    });
  });

  describe('debtTypeAccruesOverdueInterest (RN-028)', () => {
    it('REGISTRATION_FEE NO acumula OVERDUE_INTEREST (va por LATE_PAYMENT_DAILY_CHARGE)', () => {
      expect(debtTypeAccruesOverdueInterest('REGISTRATION_FEE')).toBe(false);
    });

    it('INSURANCE NO acumula OVERDUE_INTEREST', () => {
      expect(debtTypeAccruesOverdueInterest('INSURANCE')).toBe(false);
    });

    it('los cargos diarios mismos no acumulan más interés', () => {
      expect(debtTypeAccruesOverdueInterest('OVERDUE_INTEREST')).toBe(false);
      expect(debtTypeAccruesOverdueInterest('LATE_PAYMENT_DAILY_CHARGE')).toBe(
        false,
      );
    });

    it('multas y AJC sí acumulan', () => {
      expect(debtTypeAccruesOverdueInterest('MISSED_MATCH_FINE')).toBe(true);
      expect(debtTypeAccruesOverdueInterest('LATE_NOTICE_FINE')).toBe(true);
      expect(debtTypeAccruesOverdueInterest('AJC_FEE')).toBe(true);
      expect(debtTypeAccruesOverdueInterest('OTHER_MANUAL')).toBe(true);
      expect(debtTypeAccruesOverdueInterest('FRIENDLY_DEPOSIT')).toBe(true);
    });
  });

  describe('debtTypeAccruesLatePaymentCharge (RN-029)', () => {
    it('REGISTRATION_FEE e INSURANCE generan LATE_PAYMENT_DAILY_CHARGE', () => {
      expect(debtTypeAccruesLatePaymentCharge('REGISTRATION_FEE')).toBe(true);
      expect(debtTypeAccruesLatePaymentCharge('INSURANCE')).toBe(true);
    });

    it('otros tipos no', () => {
      expect(debtTypeAccruesLatePaymentCharge('MISSED_MATCH_FINE')).toBe(
        false,
      );
      expect(debtTypeAccruesLatePaymentCharge('OTHER_MANUAL')).toBe(false);
      expect(debtTypeAccruesLatePaymentCharge('LATE_PAYMENT_DAILY_CHARGE')).toBe(
        false,
      );
    });
  });

  describe('buildInterestChargeDescriptor', () => {
    it('arma concept para OVERDUE_INTEREST identificando deuda y fecha', () => {
      const desc = buildInterestChargeDescriptor({
        parentDebtId: 'debt-123',
        parentConcept: 'Multa por no presentarse',
        date: new Date('2026-05-04T03:01:00Z'),
        chargeType: 'OVERDUE_INTEREST',
      });
      expect(desc.type).toBe('OVERDUE_INTEREST');
      expect(desc.dayKey).toBe('2026-05-04');
      expect(desc.concept).toContain('Interés por día vencido');
      expect(desc.concept).toContain('debt-123');
      expect(desc.concept).toContain('2026-05-04');
    });

    it('arma concept para LATE_PAYMENT_DAILY_CHARGE', () => {
      const desc = buildInterestChargeDescriptor({
        parentDebtId: 'debt-456',
        parentConcept: 'Inscripción torneo X',
        date: new Date('2026-05-04T03:01:00Z'),
        chargeType: 'LATE_PAYMENT_DAILY_CHARGE',
      });
      expect(desc.type).toBe('LATE_PAYMENT_DAILY_CHARGE');
      expect(desc.dayKey).toBe('2026-05-04');
      expect(desc.concept).toContain('Arancel por pago fuera de fecha');
      expect(desc.concept).toContain('debt-456');
    });
  });
});
