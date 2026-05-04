import {
  canAddLevelsWithoutReplacing,
  isTeamCategorized,
  isTeamEligibleForCategory,
  MAX_LEVELS_PER_TEAM,
  validateProposedLevelCodes,
} from './team-categorization.rules';

describe('validateProposedLevelCodes (RN-044)', () => {
  it('acepta 1 nivel', () => {
    expect(validateProposedLevelCodes(['A'])).toBeNull();
  });

  it(`acepta ${MAX_LEVELS_PER_TEAM} niveles`, () => {
    expect(validateProposedLevelCodes(['A', 'B'])).toBeNull();
  });

  it('rechaza array vacío', () => {
    expect(validateProposedLevelCodes([])).toMatch(/al menos/);
  });

  it('rechaza superar el máximo', () => {
    expect(validateProposedLevelCodes(['A', 'B', 'C'])).toMatch(/RN-044/);
  });

  it('rechaza duplicados case-insensitive', () => {
    expect(validateProposedLevelCodes(['a', 'A'])).toMatch(/repetir/);
  });
});

describe('canAddLevelsWithoutReplacing', () => {
  it('permite mientras la suma sea ≤ máximo', () => {
    expect(canAddLevelsWithoutReplacing(0, 1)).toBe(true);
    expect(canAddLevelsWithoutReplacing(1, 1)).toBe(true);
    expect(canAddLevelsWithoutReplacing(2, 0)).toBe(true);
  });

  it('rechaza si la suma supera el máximo', () => {
    expect(canAddLevelsWithoutReplacing(2, 1)).toBe(false);
    expect(canAddLevelsWithoutReplacing(1, 2)).toBe(false);
  });
});

describe('isTeamCategorized (RN-039)', () => {
  it('false sin niveles, true con al menos 1', () => {
    expect(isTeamCategorized(0)).toBe(false);
    expect(isTeamCategorized(1)).toBe(true);
    expect(isTeamCategorized(2)).toBe(true);
  });
});

describe('isTeamEligibleForCategory (RN-044)', () => {
  it('si la categoría no tiene nivel objetivo, no aplica restricción', () => {
    expect(isTeamEligibleForCategory([], null)).toBe(true);
    expect(isTeamEligibleForCategory(['lvl-1'], null)).toBe(true);
  });

  it('si tiene nivel objetivo, exige match', () => {
    expect(isTeamEligibleForCategory(['lvl-1'], 'lvl-1')).toBe(true);
    expect(isTeamEligibleForCategory(['lvl-1'], 'lvl-2')).toBe(false);
    expect(isTeamEligibleForCategory([], 'lvl-1')).toBe(false);
  });

  it('soporta equipos con 2 niveles asignados', () => {
    expect(
      isTeamEligibleForCategory(['lvl-1', 'lvl-2'], 'lvl-2'),
    ).toBe(true);
  });
});
