import {
  distributeTeamsRoundRobin,
  validateCanCreateZone,
  validateTeamSingleZonePerCategory,
} from './zones.rules';

describe('validateCanCreateZone (DP-003)', () => {
  it('permite crear zonas hasta el tope configurado', () => {
    expect(validateCanCreateZone(0, 2)).toBeNull();
    expect(validateCanCreateZone(1, 2)).toBeNull();
  });

  it('rechaza cuando ya se alcanzó el tope', () => {
    expect(validateCanCreateZone(2, 2)).toContain('tope');
    expect(validateCanCreateZone(3, 2)).not.toBeNull();
  });
});

describe('validateTeamSingleZonePerCategory', () => {
  it('permite asignar a una zona nueva si el equipo no está en otra zona de la categoría', () => {
    expect(
      validateTeamSingleZonePerCategory(
        [{ zoneId: 'z1', categoryId: 'catOther' }],
        'z2',
        'catNew',
      ),
    ).toBeNull();
  });

  it('rechaza si el equipo ya está en la misma zona', () => {
    expect(
      validateTeamSingleZonePerCategory(
        [{ zoneId: 'z1', categoryId: 'cat1' }],
        'z1',
        'cat1',
      ),
    ).toContain('esta zona');
  });

  it('rechaza si el equipo ya está en otra zona de la misma categoría', () => {
    expect(
      validateTeamSingleZonePerCategory(
        [{ zoneId: 'z1', categoryId: 'cat1' }],
        'z2',
        'cat1',
      ),
    ).toContain('misma categoría');
  });

  it('acepta cuando no hay asignaciones previas', () => {
    expect(validateTeamSingleZonePerCategory([], 'z1', 'cat1')).toBeNull();
  });
});

describe('distributeTeamsRoundRobin', () => {
  it('lanza si no hay zonas', () => {
    expect(() => distributeTeamsRoundRobin(['t1'], [])).toThrow();
  });

  it('distribuye 6 equipos entre 2 zonas (3-3)', () => {
    const result = distributeTeamsRoundRobin(
      ['t1', 't2', 't3', 't4', 't5', 't6'],
      ['zA', 'zB'],
    );
    expect(result.get('zA')).toEqual(['t1', 't3', 't5']);
    expect(result.get('zB')).toEqual(['t2', 't4', 't6']);
  });

  it('distribuye 5 equipos entre 2 zonas (3-2)', () => {
    const result = distributeTeamsRoundRobin(
      ['t1', 't2', 't3', 't4', 't5'],
      ['zA', 'zB'],
    );
    expect(result.get('zA')).toHaveLength(3);
    expect(result.get('zB')).toHaveLength(2);
  });

  it('1 sola zona — todos los equipos van ahí', () => {
    const result = distributeTeamsRoundRobin(['t1', 't2', 't3'], ['zA']);
    expect(result.get('zA')).toEqual(['t1', 't2', 't3']);
  });

  it('cero equipos — devuelve zonas vacías', () => {
    const result = distributeTeamsRoundRobin([], ['zA', 'zB']);
    expect(result.get('zA')).toEqual([]);
    expect(result.get('zB')).toEqual([]);
  });
});
