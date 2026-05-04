import { validateCategoryLevelSportMatches } from './category-level.rules';

describe('validateCategoryLevelSportMatches (RN-044)', () => {
  it('acepta cuando los sportId coinciden', () => {
    expect(
      validateCategoryLevelSportMatches(
        { sportId: 'basket' },
        { sportId: 'basket' },
      ),
    ).toBeNull();
  });

  it('rechaza cuando los sportId difieren', () => {
    expect(
      validateCategoryLevelSportMatches(
        { sportId: 'futbol' },
        { sportId: 'basket' },
      ),
    ).toContain('mismo deporte');
  });
});
