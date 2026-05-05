import {
  filterBlockingSanctions,
  isSanctionActiveAt,
  sanctionMatchesScope,
  SanctionLike,
} from './active-suspension.rules';

const baseSanction = (overrides: Partial<SanctionLike> = {}): SanctionLike => ({
  id: 's',
  status: 'ACTIVE',
  kind: 'DISCIPLINARY',
  matchId: null,
  tournamentId: null,
  categoryId: null,
  startsAt: null,
  endsAt: null,
  ...overrides,
});

describe('active-suspension.rules', () => {
  describe('isSanctionActiveAt', () => {
    it('inactive when status != ACTIVE', () => {
      expect(
        isSanctionActiveAt(baseSanction({ status: 'RESOLVED' }), new Date()),
      ).toBe(false);
    });

    it('inactive when startsAt is in future', () => {
      const future = new Date(Date.now() + 60_000);
      expect(
        isSanctionActiveAt(
          baseSanction({ startsAt: future }),
          new Date(),
        ),
      ).toBe(false);
    });

    it('inactive when endsAt is in past', () => {
      const past = new Date(Date.now() - 60_000);
      expect(
        isSanctionActiveAt(baseSanction({ endsAt: past }), new Date()),
      ).toBe(false);
    });

    it('active when within range', () => {
      const past = new Date(Date.now() - 60_000);
      const future = new Date(Date.now() + 60_000);
      expect(
        isSanctionActiveAt(
          baseSanction({ startsAt: past, endsAt: future }),
          new Date(),
        ),
      ).toBe(true);
    });
  });

  describe('sanctionMatchesScope', () => {
    it('global sanction matches any scope', () => {
      expect(sanctionMatchesScope(baseSanction(), {})).toBe(true);
    });

    it('match-scope blocks only that match', () => {
      const s = baseSanction({ matchId: 'm1' });
      expect(sanctionMatchesScope(s, { matchId: 'm1' })).toBe(true);
      expect(sanctionMatchesScope(s, { matchId: 'm2' })).toBe(false);
      expect(sanctionMatchesScope(s, {})).toBe(false);
    });

    it('category-scope only blocks that category', () => {
      const s = baseSanction({ categoryId: 'c1' });
      expect(sanctionMatchesScope(s, { categoryId: 'c1' })).toBe(true);
      expect(sanctionMatchesScope(s, { categoryId: 'c2' })).toBe(false);
    });

    it('tournament-scope only blocks that tournament', () => {
      const s = baseSanction({ tournamentId: 't1' });
      expect(sanctionMatchesScope(s, { tournamentId: 't1' })).toBe(true);
      expect(sanctionMatchesScope(s, { tournamentId: 't2' })).toBe(false);
    });
  });

  describe('filterBlockingSanctions', () => {
    it('combina activas + scope', () => {
      const s1 = baseSanction({ id: '1', tournamentId: 't1' });
      const s2 = baseSanction({ id: '2', status: 'RESOLVED' });
      const s3 = baseSanction({ id: '3' }); // global activa
      const out = filterBlockingSanctions(
        [s1, s2, s3],
        { tournamentId: 't1' },
        new Date(),
      );
      expect(out.map((s) => s.id).sort()).toEqual(['1', '3']);
    });
  });
});
