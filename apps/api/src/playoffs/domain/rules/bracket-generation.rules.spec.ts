import {
  GAMES_PER_FORMAT,
  WINS_TO_CLINCH,
  planBracket,
  QualifiedTeam,
} from './bracket-generation.rules';

describe('planBracket', () => {
  const make = (rank: number, zoneId: string | null): QualifiedTeam => ({
    teamId: `team-${zoneId ?? 'X'}-${rank}`,
    teamName: `Team ${zoneId ?? 'X'}${rank}`,
    zoneRank: rank,
    zoneId,
  });

  it('1 zona, 8 equipos: genera QF + SF + FINAL con cruce 1vs8/2vs7/3vs6/4vs5', () => {
    const qualifiers = [1, 2, 3, 4, 5, 6, 7, 8].map((r) => make(r, 'zoneA'));
    const plans = planBracket({
      qualifiers,
      zonesCount: 1,
      formatByRound: { quarterfinal: 'BO3', semifinal: 'BO3', final: 'BO5' },
      defaultFormat: 'BO3',
      hasThirdPlaceMatch: false,
      hasPlayIn: false,
    });

    const qf = plans.filter((p) => p.round === 'QUARTERFINAL');
    expect(qf).toHaveLength(4);
    expect(qf[0].homeTeamId).toBe('team-zoneA-1');
    expect(qf[0].awayTeamId).toBe('team-zoneA-8');
    expect(qf[1].homeTeamId).toBe('team-zoneA-2');
    expect(qf[1].awayTeamId).toBe('team-zoneA-7');
    expect(qf[2].homeTeamId).toBe('team-zoneA-3');
    expect(qf[2].awayTeamId).toBe('team-zoneA-6');
    expect(qf[3].homeTeamId).toBe('team-zoneA-4');
    expect(qf[3].awayTeamId).toBe('team-zoneA-5');

    const sf = plans.filter((p) => p.round === 'SEMIFINAL');
    expect(sf).toHaveLength(2);
    expect(sf.every((s) => s.homeTeamId === null && s.awayTeamId === null)).toBe(
      true,
    );
    expect(sf[0].feedsFromA).toBe(1);
    expect(sf[0].feedsFromB).toBe(2);

    const finals = plans.filter((p) => p.round === 'FINAL');
    expect(finals).toHaveLength(1);
    expect(finals[0].format).toBe('BO5');
  });

  it('2 zonas con 4 por zona: cruce NBA (1A vs 4B, 2A vs 3B, 1B vs 4A, 2B vs 3A) + final', () => {
    const A = [1, 2, 3, 4].map((r) => make(r, 'zoneA'));
    const B = [1, 2, 3, 4].map((r) => make(r, 'zoneB'));
    const plans = planBracket({
      qualifiers: [...A, ...B],
      zonesCount: 2,
      formatByRound: { quarterfinal: 'BO3', semifinal: 'BO3', final: 'BO5' },
      defaultFormat: 'BO3',
      hasThirdPlaceMatch: true,
      hasPlayIn: false,
    });

    const qf = plans.filter((p) => p.round === 'QUARTERFINAL');
    expect(qf).toHaveLength(4);
    expect(qf[0].homeTeamId).toBe('team-zoneA-1');
    expect(qf[0].awayTeamId).toBe('team-zoneB-4');
    expect(qf[1].homeTeamId).toBe('team-zoneA-2');
    expect(qf[1].awayTeamId).toBe('team-zoneB-3');
    expect(qf[2].homeTeamId).toBe('team-zoneB-1');
    expect(qf[2].awayTeamId).toBe('team-zoneA-4');
    expect(qf[3].homeTeamId).toBe('team-zoneB-2');
    expect(qf[3].awayTeamId).toBe('team-zoneA-3');

    const sf = plans.filter((p) => p.round === 'SEMIFINAL');
    expect(sf).toHaveLength(2);

    const finals = plans.filter((p) => p.round === 'FINAL');
    expect(finals).toHaveLength(1);

    const third = plans.filter((p) => p.round === 'THIRD_PLACE');
    expect(third).toHaveLength(1);
  });

  it('1 zona, 4 equipos: comienza directo en SEMIFINAL', () => {
    const qualifiers = [1, 2, 3, 4].map((r) => make(r, 'zoneA'));
    const plans = planBracket({
      qualifiers,
      zonesCount: 1,
      formatByRound: null,
      hasThirdPlaceMatch: false,
      hasPlayIn: false,
    });
    const sf = plans.filter((p) => p.round === 'SEMIFINAL');
    expect(sf).toHaveLength(2);
    expect(plans.find((p) => p.round === 'QUARTERFINAL')).toBeUndefined();
  });

  it('hasThirdPlaceMatch agrega serie de THIRD_PLACE alimentada por las semis', () => {
    const A = [1, 2, 3, 4].map((r) => make(r, 'zoneA'));
    const B = [1, 2, 3, 4].map((r) => make(r, 'zoneB'));
    const plans = planBracket({
      qualifiers: [...A, ...B],
      zonesCount: 2,
      formatByRound: null,
      hasThirdPlaceMatch: true,
      hasPlayIn: false,
    });
    const third = plans.find((p) => p.round === 'THIRD_PLACE');
    expect(third?.feedsFromA).toBe(1);
    expect(third?.feedsFromB).toBe(2);
  });
});

describe('format constants', () => {
  it('WINS_TO_CLINCH', () => {
    expect(WINS_TO_CLINCH.BO1).toBe(1);
    expect(WINS_TO_CLINCH.BO3).toBe(2);
    expect(WINS_TO_CLINCH.BO5).toBe(3);
  });
  it('GAMES_PER_FORMAT', () => {
    expect(GAMES_PER_FORMAT.BO1).toBe(1);
    expect(GAMES_PER_FORMAT.BO3).toBe(3);
    expect(GAMES_PER_FORMAT.BO5).toBe(5);
  });
});
