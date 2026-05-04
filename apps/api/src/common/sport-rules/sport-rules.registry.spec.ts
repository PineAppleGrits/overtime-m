import { SportRulesRegistry } from './sport-rules.registry';
import { Basketball5v5Rules } from './strategies/basketball-5v5.rules';
import { Basketball3v3Rules } from './strategies/basketball-3v3.rules';

describe('SportRulesRegistry', () => {
  let registry: SportRulesRegistry;

  beforeEach(() => {
    registry = new SportRulesRegistry();
  });

  it('resolves Basketball 5v5 strategy', () => {
    const rules = registry.get('BASKETBALL', '5v5');
    expect(rules).toBeInstanceOf(Basketball5v5Rules);
    expect(rules.key).toBe('BASKETBALL_5v5');
  });

  it('resolves Basketball 3v3 strategy', () => {
    const rules = registry.get('BASKETBALL', '3v3');
    expect(rules).toBeInstanceOf(Basketball3v3Rules);
    expect(rules.key).toBe('BASKETBALL_3v3');
  });

  it('throws for unknown combinations', () => {
    expect(() => registry.get('BASKETBALL', 'invalid' as never)).toThrow(
      /No hay strategy/,
    );
  });

  it('tryGet returns null for unknown combinations', () => {
    expect(registry.tryGet('BASKETBALL', 'invalid' as never)).toBeNull();
  });

  it('lists registered strategies', () => {
    const list = registry.list();
    expect(list).toHaveLength(2);
    expect(list.map((r) => r.key).sort()).toEqual([
      'BASKETBALL_3v3',
      'BASKETBALL_5v5',
    ]);
  });
});

describe('Basketball5v5Rules', () => {
  const rules = new Basketball5v5Rules();

  it('roster: min 8, max 25, 5 en cancha (RN-009 + FIBA)', () => {
    expect(rules.roster.rosterMin).toBe(8);
    expect(rules.roster.rosterMax).toBe(25);
    expect(rules.roster.playersOnCourt).toBe(5);
    expect(rules.roster.minPlayersToStart).toBe(5);
  });

  it('scoring FIBA: 2 victoria, 1 derrota, 0 no presentación', () => {
    expect(rules.scoring.win).toBe(2);
    expect(rules.scoring.loss).toBe(1);
    expect(rules.scoring.noShow).toBe(0);
  });

  it('staff mínimo 1+1 (RN-049)', () => {
    expect(rules.staff.minReferees).toBe(1);
    expect(rules.staff.minTableOfficials).toBe(1);
    expect(rules.staff.idealReferees).toBe(2);
    expect(rules.staff.idealTableOfficials).toBe(2);
  });

  describe('validateScore', () => {
    it('acepta marcadores válidos', () => {
      expect(rules.validateScore(85, 80)).toBeNull();
      expect(rules.validateScore(0, 0)).toBeNull(); // 0-0 administrativo permitido
    });

    it('rechaza valores no enteros', () => {
      expect(rules.validateScore(85.5, 80)).not.toBeNull();
    });

    it('rechaza valores negativos', () => {
      expect(rules.validateScore(-1, 80)).not.toBeNull();
    });
  });

  describe('scoreCountsForStandings (RN-024)', () => {
    it('un 0-0 NO suma puntos', () => {
      expect(rules.scoreCountsForStandings(0, 0)).toBe(false);
    });

    it('cualquier otro marcador SÍ suma', () => {
      expect(rules.scoreCountsForStandings(85, 80)).toBe(true);
      expect(rules.scoreCountsForStandings(20, 0)).toBe(true); // RN-032 — 20-0 por no presentación
    });
  });
});

describe('Basketball3v3Rules', () => {
  const rules = new Basketball3v3Rules();

  it('roster: min 4, max 6, 3 en cancha', () => {
    expect(rules.roster.rosterMin).toBe(4);
    expect(rules.roster.rosterMax).toBe(6);
    expect(rules.roster.playersOnCourt).toBe(3);
    expect(rules.roster.minPlayersToStart).toBe(3);
  });

  it('comparte scoring y staff con 5v5 (FIBA)', () => {
    const fiveV5 = new Basketball5v5Rules();
    expect(rules.scoring).toEqual(fiveV5.scoring);
    expect(rules.staff).toEqual(fiveV5.staff);
  });
});
