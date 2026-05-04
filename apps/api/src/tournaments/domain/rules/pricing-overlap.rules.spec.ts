import {
  findOverlappingPeriod,
  isValidPeriod,
  periodsOverlap,
  pickCurrentPeriod,
  PricingPeriod,
} from './pricing-overlap.rules';

const d = (iso: string): Date => new Date(iso);

describe('pricing-overlap.rules', () => {
  describe('isValidPeriod', () => {
    it('valida cuando from < to', () => {
      expect(
        isValidPeriod({
          validFrom: d('2026-01-01T00:00:00Z'),
          validTo: d('2026-02-01T00:00:00Z'),
        }),
      ).toBe(true);
    });

    it('rechaza cuando from === to', () => {
      const t = d('2026-01-01T00:00:00Z');
      expect(isValidPeriod({ validFrom: t, validTo: t })).toBe(false);
    });

    it('rechaza cuando from > to', () => {
      expect(
        isValidPeriod({
          validFrom: d('2026-02-01T00:00:00Z'),
          validTo: d('2026-01-01T00:00:00Z'),
        }),
      ).toBe(false);
    });
  });

  describe('periodsOverlap', () => {
    const a: PricingPeriod = {
      validFrom: d('2026-01-01T00:00:00Z'),
      validTo: d('2026-01-31T23:59:59Z'),
    };

    it('detecta solapamiento cuando b.start está dentro de a', () => {
      expect(
        periodsOverlap(a, {
          validFrom: d('2026-01-15T00:00:00Z'),
          validTo: d('2026-02-15T00:00:00Z'),
        }),
      ).toBe(true);
    });

    it('detecta solapamiento cuando uno contiene al otro', () => {
      expect(
        periodsOverlap(a, {
          validFrom: d('2025-12-01T00:00:00Z'),
          validTo: d('2026-03-01T00:00:00Z'),
        }),
      ).toBe(true);
    });

    it('rechaza cuando son consecutivos sin tocarse', () => {
      expect(
        periodsOverlap(a, {
          validFrom: d('2026-02-01T00:00:01Z'),
          validTo: d('2026-02-28T00:00:00Z'),
        }),
      ).toBe(false);
    });

    it('considera overlap si comparten exactamente un instante', () => {
      // Convención: rangos cerrados (inclusivos en ambos extremos).
      expect(
        periodsOverlap(a, {
          validFrom: d('2026-01-31T23:59:59Z'),
          validTo: d('2026-02-15T00:00:00Z'),
        }),
      ).toBe(true);
    });
  });

  describe('findOverlappingPeriod', () => {
    const existing: PricingPeriod[] = [
      {
        id: 'p1',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T23:59:59Z'),
      },
      {
        id: 'p2',
        validFrom: d('2026-02-15T00:00:00Z'),
        validTo: d('2026-02-28T23:59:59Z'),
      },
    ];

    it('devuelve el conflicto cuando existe', () => {
      const conflict = findOverlappingPeriod(
        {
          validFrom: d('2026-01-15T00:00:00Z'),
          validTo: d('2026-02-15T00:00:00Z'),
        },
        existing,
      );
      expect(conflict?.id).toBe('p1');
    });

    it('devuelve null cuando no hay conflicto', () => {
      const conflict = findOverlappingPeriod(
        {
          validFrom: d('2026-03-01T00:00:00Z'),
          validTo: d('2026-03-31T00:00:00Z'),
        },
        existing,
      );
      expect(conflict).toBeNull();
    });

    it('excluye el período por id (caso update)', () => {
      const conflict = findOverlappingPeriod(
        {
          id: 'p1',
          validFrom: d('2026-01-05T00:00:00Z'),
          validTo: d('2026-01-25T00:00:00Z'),
        },
        existing,
        'p1',
      );
      expect(conflict).toBeNull();
    });
  });

  describe('pickCurrentPeriod', () => {
    const periods: PricingPeriod[] = [
      {
        id: 'p1',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T23:59:59Z'),
      },
      {
        id: 'p2',
        validFrom: d('2026-02-15T00:00:00Z'),
        validTo: d('2026-02-28T23:59:59Z'),
      },
    ];

    it('devuelve el período vigente al instante dado', () => {
      const current = pickCurrentPeriod(periods, d('2026-01-15T12:00:00Z'));
      expect(current?.id).toBe('p1');
    });

    it('devuelve null si no hay período vigente', () => {
      const current = pickCurrentPeriod(periods, d('2026-02-05T00:00:00Z'));
      expect(current).toBeNull();
    });
  });
});
