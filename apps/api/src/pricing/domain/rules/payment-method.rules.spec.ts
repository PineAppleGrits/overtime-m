import {
  decodeCurrency,
  encodeCurrency,
  isPaymentMethod,
  methodsOverlap,
} from './payment-method.rules';

describe('payment-method.rules', () => {
  describe('encodeCurrency / decodeCurrency', () => {
    it('encodea sin método cuando es null', () => {
      expect(encodeCurrency('ARS', null)).toBe('ARS');
    });

    it('encodea con método específico', () => {
      expect(encodeCurrency('ARS', 'cash')).toBe('ARS:cash');
      expect(encodeCurrency('usd', 'transfer')).toBe('USD:transfer');
    });

    it('decodea legacy (sin sufijo)', () => {
      expect(decodeCurrency('ARS')).toEqual({
        currency: 'ARS',
        paymentMethod: null,
      });
    });

    it('decodea con método válido', () => {
      expect(decodeCurrency('ARS:cash')).toEqual({
        currency: 'ARS',
        paymentMethod: 'cash',
      });
      expect(decodeCurrency('USD:card')).toEqual({
        currency: 'USD',
        paymentMethod: 'card',
      });
    });

    it('descarta sufijo desconocido como null', () => {
      expect(decodeCurrency('ARS:weird')).toEqual({
        currency: 'ARS',
        paymentMethod: null,
      });
    });

    it('roundtrip preserva la información', () => {
      const cases = [
        { ccy: 'ARS', method: null },
        { ccy: 'ARS', method: 'cash' as const },
        { ccy: 'USD', method: 'transfer' as const },
        { ccy: 'EUR', method: 'card' as const },
      ];
      for (const { ccy, method } of cases) {
        const encoded = encodeCurrency(ccy, method);
        expect(decodeCurrency(encoded)).toEqual({
          currency: ccy,
          paymentMethod: method,
        });
      }
    });
  });

  describe('isPaymentMethod', () => {
    it.each(['cash', 'transfer', 'card'])('acepta %s', (m) => {
      expect(isPaymentMethod(m)).toBe(true);
    });

    it.each(['Cash', 'efectivo', '', null, undefined, 5])(
      'rechaza %p',
      (v) => {
        expect(isPaymentMethod(v as unknown)).toBe(false);
      },
    );
  });

  describe('methodsOverlap', () => {
    it('null overlapea con todos', () => {
      expect(methodsOverlap(null, null)).toBe(true);
      expect(methodsOverlap(null, 'cash')).toBe(true);
      expect(methodsOverlap('transfer', null)).toBe(true);
    });

    it('métodos específicos: solo solapan si coinciden', () => {
      expect(methodsOverlap('cash', 'cash')).toBe(true);
      expect(methodsOverlap('cash', 'transfer')).toBe(false);
      expect(methodsOverlap('card', 'transfer')).toBe(false);
    });
  });
});
