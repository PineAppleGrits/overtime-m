import {
  findConflictingPeriod,
  isValidPeriod,
  pickApplicablePeriod,
  PricingPeriodWithMethod,
} from './pricing-overlap-with-method.rules';

const d = (iso: string): Date => new Date(iso);

describe('pricing-overlap-with-method.rules', () => {
  describe('isValidPeriod', () => {
    it('valida from < to', () => {
      expect(
        isValidPeriod({
          validFrom: d('2026-01-01T00:00:00Z'),
          validTo: d('2026-02-01T00:00:00Z'),
        }),
      ).toBe(true);
    });

    it('rechaza from === to', () => {
      const t = d('2026-01-01T00:00:00Z');
      expect(isValidPeriod({ validFrom: t, validTo: t })).toBe(false);
    });
  });

  describe('findConflictingPeriod', () => {
    const baseExisting: PricingPeriodWithMethod[] = [
      {
        id: 'p1-cash',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T23:59:59Z'),
        paymentMethod: 'cash',
      },
      {
        id: 'p2-transfer',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-01-31T23:59:59Z'),
        paymentMethod: 'transfer',
      },
    ];

    it('NO conflictúa períodos del mismo rango pero distinto método', () => {
      const conflict = findConflictingPeriod(
        {
          validFrom: d('2026-01-15T00:00:00Z'),
          validTo: d('2026-01-20T00:00:00Z'),
          paymentMethod: 'card',
        },
        baseExisting,
      );
      expect(conflict).toBeNull();
    });

    it('conflictúa si las fechas y el método coinciden', () => {
      const conflict = findConflictingPeriod(
        {
          validFrom: d('2026-01-15T00:00:00Z'),
          validTo: d('2026-01-20T00:00:00Z'),
          paymentMethod: 'cash',
        },
        baseExisting,
      );
      expect(conflict?.id).toBe('p1-cash');
    });

    it('un período null colisiona con todos los métodos en el mismo rango', () => {
      const conflict = findConflictingPeriod(
        {
          validFrom: d('2026-01-15T00:00:00Z'),
          validTo: d('2026-01-20T00:00:00Z'),
          paymentMethod: null,
        },
        baseExisting,
      );
      expect(conflict).not.toBeNull();
    });

    it('un período específico colisiona con un null preexistente', () => {
      const existing: PricingPeriodWithMethod[] = [
        {
          id: 'p-null',
          validFrom: d('2026-01-01T00:00:00Z'),
          validTo: d('2026-01-31T23:59:59Z'),
          paymentMethod: null,
        },
      ];
      const conflict = findConflictingPeriod(
        {
          validFrom: d('2026-01-15T00:00:00Z'),
          validTo: d('2026-01-20T00:00:00Z'),
          paymentMethod: 'cash',
        },
        existing,
      );
      expect(conflict?.id).toBe('p-null');
    });

    it('excluye por id (caso update)', () => {
      const conflict = findConflictingPeriod(
        {
          id: 'p1-cash',
          validFrom: d('2026-01-05T00:00:00Z'),
          validTo: d('2026-01-25T00:00:00Z'),
          paymentMethod: 'cash',
        },
        baseExisting,
        'p1-cash',
      );
      expect(conflict).toBeNull();
    });

    it('NO conflictúa cuando los rangos no se tocan', () => {
      const conflict = findConflictingPeriod(
        {
          validFrom: d('2026-03-01T00:00:00Z'),
          validTo: d('2026-03-31T00:00:00Z'),
          paymentMethod: null,
        },
        baseExisting,
      );
      expect(conflict).toBeNull();
    });
  });

  describe('pickApplicablePeriod', () => {
    const periods: PricingPeriodWithMethod[] = [
      {
        id: 'general',
        validFrom: d('2026-01-01T00:00:00Z'),
        validTo: d('2026-03-31T00:00:00Z'),
        paymentMethod: null,
      },
      {
        id: 'cash-feb',
        validFrom: d('2026-02-01T00:00:00Z'),
        validTo: d('2026-02-28T23:59:59Z'),
        paymentMethod: 'cash',
      },
    ];

    it('prioriza match exacto sobre fallback', () => {
      const r = pickApplicablePeriod(
        periods,
        'cash',
        d('2026-02-15T00:00:00Z'),
      );
      expect(r?.id).toBe('cash-feb');
    });

    it('cae al fallback cuando no hay match exacto', () => {
      const r = pickApplicablePeriod(
        periods,
        'transfer',
        d('2026-02-15T00:00:00Z'),
      );
      expect(r?.id).toBe('general');
    });

    it('sin método requerido devuelve solo el fallback (no-method)', () => {
      const r = pickApplicablePeriod(
        periods,
        null,
        d('2026-02-15T00:00:00Z'),
      );
      expect(r?.id).toBe('general');
    });

    it('devuelve null cuando ningún período cubre el instante', () => {
      const r = pickApplicablePeriod(
        periods,
        'cash',
        d('2025-12-15T00:00:00Z'),
      );
      expect(r).toBeNull();
    });

    it('devuelve null cuando solo hay específicos y el instante no los cubre', () => {
      const onlySpecific: PricingPeriodWithMethod[] = [
        {
          id: 'cash-only',
          validFrom: d('2026-02-01T00:00:00Z'),
          validTo: d('2026-02-28T23:59:59Z'),
          paymentMethod: 'cash',
        },
      ];
      const r = pickApplicablePeriod(
        onlySpecific,
        'cash',
        d('2026-03-15T00:00:00Z'),
      );
      expect(r).toBeNull();
    });
  });
});
