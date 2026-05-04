import {
  isDiscountMetadata,
  toDisplayDiscountAmount,
  toPersistedDebtAmount,
  validateDiscountAmount,
} from './discount-amount.rules';

describe('discount-amount.rules', () => {
  describe('validateDiscountAmount', () => {
    it('acepta enteros positivos', () => {
      expect(validateDiscountAmount(1000)).toBeNull();
      expect(validateDiscountAmount(50000)).toBeNull();
    });

    it('acepta hasta 2 decimales', () => {
      expect(validateDiscountAmount(1000.5)).toBeNull();
      expect(validateDiscountAmount(1000.99)).toBeNull();
    });

    it('rechaza más de 2 decimales', () => {
      expect(validateDiscountAmount(1000.123)).toEqual({
        reason: 'TOO_MANY_DECIMALS',
        amount: 1000.123,
      });
    });

    it('rechaza monto cero o negativo', () => {
      expect(validateDiscountAmount(0)).toEqual({
        reason: 'NOT_POSITIVE',
        amount: 0,
      });
      expect(validateDiscountAmount(-100)).toEqual({
        reason: 'NOT_POSITIVE',
        amount: -100,
      });
    });

    it('rechaza monto demasiado grande', () => {
      expect(validateDiscountAmount(100_000_000)).toEqual({
        reason: 'TOO_LARGE',
        amount: 100_000_000,
      });
    });

    it('rechaza NaN / Infinity', () => {
      expect(validateDiscountAmount(NaN)).toEqual({
        reason: 'NOT_FINITE',
        amount: NaN,
      });
      expect(validateDiscountAmount(Infinity)).toEqual({
        reason: 'NOT_FINITE',
        amount: Infinity,
      });
    });
  });

  describe('signo persistido vs display', () => {
    it('persiste como negativo', () => {
      expect(toPersistedDebtAmount(1000)).toBe(-1000);
      expect(toPersistedDebtAmount(1000.5)).toBe(-1000.5);
    });

    it('display vuelve a positivo', () => {
      expect(toDisplayDiscountAmount(-1000)).toBe(1000);
      expect(toDisplayDiscountAmount(-1000.5)).toBe(1000.5);
    });

    it('roundtrip preserva monto', () => {
      const inputs = [100, 1234.56, 0.5];
      for (const v of inputs) {
        expect(toDisplayDiscountAmount(toPersistedDebtAmount(v))).toBe(v);
      }
    });
  });

  describe('isDiscountMetadata', () => {
    it('reconoce { kind: DISCOUNT }', () => {
      expect(isDiscountMetadata({ kind: 'DISCOUNT' })).toBe(true);
      expect(isDiscountMetadata({ kind: 'DISCOUNT', extra: 1 })).toBe(true);
    });

    it('rechaza otros shapes', () => {
      expect(isDiscountMetadata(null)).toBe(false);
      expect(isDiscountMetadata({})).toBe(false);
      expect(isDiscountMetadata({ kind: 'OTHER' })).toBe(false);
      expect(isDiscountMetadata('DISCOUNT')).toBe(false);
    });
  });
});
