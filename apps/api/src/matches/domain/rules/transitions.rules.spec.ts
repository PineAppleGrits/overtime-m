import {
  MATCH_STATUS,
  canTransitionMatchStatus,
  isTerminal,
  listAllowedTransitions,
} from './transitions.rules';

describe('match transitions rules', () => {
  it('PROGRAMADO admite EN_CURSO, CANCELADO, REPROGRAMADO, PENDING_RIVAL_DECISION, FINALIZADO, SUSPENDIDO', () => {
    const allowed = listAllowedTransitions(MATCH_STATUS.PROGRAMADO);
    expect(allowed).toEqual(
      expect.arrayContaining([
        MATCH_STATUS.EN_CURSO,
        MATCH_STATUS.CANCELADO,
        MATCH_STATUS.REPROGRAMADO,
        MATCH_STATUS.PENDING_RIVAL_DECISION,
        MATCH_STATUS.FINALIZADO,
        MATCH_STATUS.SUSPENDIDO,
      ]),
    );
  });

  it('FINALIZADO es terminal', () => {
    expect(isTerminal(MATCH_STATUS.FINALIZADO)).toBe(true);
    expect(isTerminal(MATCH_STATUS.FINALIZADO_CON_RESOLUCION)).toBe(true);
    expect(isTerminal(MATCH_STATUS.CANCELADO)).toBe(true);
  });

  it('PENDING_RIVAL_DECISION solo permite resoluciones (FINALIZADO, REPROGRAMADO, PROGRAMADO, CANCELADO)', () => {
    expect(
      canTransitionMatchStatus(
        MATCH_STATUS.PENDING_RIVAL_DECISION,
        MATCH_STATUS.FINALIZADO,
      ),
    ).toBe(true);
    expect(
      canTransitionMatchStatus(
        MATCH_STATUS.PENDING_RIVAL_DECISION,
        MATCH_STATUS.PROGRAMADO,
      ),
    ).toBe(true);
    expect(
      canTransitionMatchStatus(
        MATCH_STATUS.PENDING_RIVAL_DECISION,
        MATCH_STATUS.EN_CURSO,
      ),
    ).toBe(false);
  });

  it('EN_CURSO permite transiciones a SUSPENDIDO_*, FINALIZADO_*, CANCELADO', () => {
    expect(
      canTransitionMatchStatus(
        MATCH_STATUS.EN_CURSO,
        MATCH_STATUS.SUSPENDIDO_A_REANUDAR,
      ),
    ).toBe(true);
    expect(
      canTransitionMatchStatus(
        MATCH_STATUS.EN_CURSO,
        MATCH_STATUS.SUSPENDIDO_PENDIENTE,
      ),
    ).toBe(true);
    expect(
      canTransitionMatchStatus(
        MATCH_STATUS.EN_CURSO,
        MATCH_STATUS.FINALIZADO_CON_RESOLUCION,
      ),
    ).toBe(true);
  });

  it('estados terminales no permiten ninguna transición', () => {
    expect(
      canTransitionMatchStatus(MATCH_STATUS.FINALIZADO, MATCH_STATUS.PROGRAMADO),
    ).toBe(false);
    expect(
      canTransitionMatchStatus(MATCH_STATUS.CANCELADO, MATCH_STATUS.EN_CURSO),
    ).toBe(false);
  });
});
