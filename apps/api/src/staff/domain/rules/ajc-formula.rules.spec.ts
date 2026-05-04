import { computeAjcFee } from './ajc-formula.rules';

describe('computeAjcFee (RN-030)', () => {
  it('multiplica sueldo del árbitro por fechas a liberar', () => {
    expect(computeAjcFee(5000, 2)).toBe(10000);
    expect(computeAjcFee(7500, 3)).toBe(22500);
    expect(computeAjcFee(10000, 1)).toBe(10000);
  });

  it('rechaza sueldos no positivos', () => {
    expect(() => computeAjcFee(0, 2)).toThrow();
    expect(() => computeAjcFee(-100, 2)).toThrow();
    expect(() => computeAjcFee(NaN as unknown as number, 2)).toThrow();
  });

  it('rechaza fechas no enteras o no positivas', () => {
    expect(() => computeAjcFee(5000, 0)).toThrow();
    expect(() => computeAjcFee(5000, -1)).toThrow();
    expect(() => computeAjcFee(5000, 1.5)).toThrow();
  });
});
