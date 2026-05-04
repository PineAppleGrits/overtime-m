import { CategoryLevel } from '../entities/category-level.entity';
import { LevelCode } from '../value-objects/level-code.vo';
import {
  highestLevel,
  lowestLevel,
  MAX_LEVELS_PER_TEAM,
  sortByRankAsc,
  teamMatchesCategoryLevel,
  validateLevelCodesForTeam,
} from './category-level.rules';

const make = (
  id: string,
  code: string,
  rank: number,
): CategoryLevel =>
  new CategoryLevel(
    id,
    'sport-1',
    LevelCode.create(code),
    `Nivel ${code}`,
    rank,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );

describe('LevelCode', () => {
  it('acepta códigos alfanuméricos en mayúscula', () => {
    expect(LevelCode.create('A').value).toBe('A');
    expect(LevelCode.create('B2').value).toBe('B2');
    expect(LevelCode.create('  C ').value).toBe('C');
  });

  it('rechaza minúsculas, símbolos y vacíos', () => {
    expect(() => LevelCode.create('')).toThrow();
    expect(() => LevelCode.create('a')).toThrow();
    expect(() => LevelCode.create('A!')).toThrow();
    expect(() => LevelCode.create('AAAAAAAAA')).toThrow(); // > 8
  });
});

describe('CategoryLevel comparators', () => {
  const A = make('a', 'A', 1);
  const B = make('b', 'B', 2);
  const C = make('c', 'C', 3);

  it('compara por rank (menor = más alto)', () => {
    expect(A.isHigherThan(B)).toBe(true);
    expect(B.isLowerThan(A)).toBe(true);
    expect(A.compareRank(A)).toBe(0);
  });

  it('highestLevel/lowestLevel/sortByRankAsc', () => {
    expect(highestLevel([B, A, C])?.id).toBe('a');
    expect(lowestLevel([B, A, C])?.id).toBe('c');
    expect(sortByRankAsc([B, A, C]).map((l) => l.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('lowestLevel/highestLevel sobre array vacío devuelve null', () => {
    expect(highestLevel([])).toBeNull();
    expect(lowestLevel([])).toBeNull();
  });
});

describe('validateLevelCodesForTeam (RN-044)', () => {
  it('acepta 1 o 2 códigos únicos', () => {
    expect(validateLevelCodesForTeam(['A'])).toBeNull();
    expect(validateLevelCodesForTeam(['A', 'B'])).toBeNull();
  });

  it('rechaza vacío', () => {
    expect(validateLevelCodesForTeam([])).toMatch(/al menos un nivel/);
  });

  it(`rechaza más de ${MAX_LEVELS_PER_TEAM}`, () => {
    expect(validateLevelCodesForTeam(['A', 'B', 'C'])).toMatch(/RN-044/);
  });

  it('rechaza duplicados', () => {
    expect(validateLevelCodesForTeam(['A', 'A'])).toMatch(/repetir/);
  });
});

describe('teamMatchesCategoryLevel', () => {
  it('devuelve true cuando el id objetivo está en los niveles del equipo', () => {
    expect(teamMatchesCategoryLevel(['lvl-1', 'lvl-2'], 'lvl-1')).toBe(true);
  });

  it('devuelve false cuando no coincide', () => {
    expect(teamMatchesCategoryLevel(['lvl-1', 'lvl-2'], 'lvl-3')).toBe(false);
  });
});
