import { canTransition, assertCanTransition } from './sanction-transitions.rules';

describe('sanction-transitions.rules', () => {
  it('ACTIVE → RESOLVED permitido', () => {
    expect(canTransition('ACTIVE', 'RESOLVED')).toBe(true);
  });

  it('ACTIVE → CANCELLED permitido', () => {
    expect(canTransition('ACTIVE', 'CANCELLED')).toBe(true);
  });

  it('ACTIVE → ACTIVE no permitido', () => {
    expect(canTransition('ACTIVE', 'ACTIVE')).toBe(false);
  });

  it('RESOLVED → cualquier cosa no permitido', () => {
    expect(canTransition('RESOLVED', 'CANCELLED')).toBe(false);
    expect(canTransition('RESOLVED', 'ACTIVE')).toBe(false);
  });

  it('CANCELLED → cualquier cosa no permitido', () => {
    expect(canTransition('CANCELLED', 'RESOLVED')).toBe(false);
  });

  it('assertCanTransition lanza con transición inválida', () => {
    expect(() => assertCanTransition('RESOLVED', 'ACTIVE')).toThrow();
  });
});
