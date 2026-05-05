import {
  checkPlayerTournamentLimits,
  isAlreadyOverLimit,
} from './player-tournament-limits.rules';

describe('player-tournament-limits.rules', () => {
  describe('checkPlayerTournamentLimits', () => {
    it('no violation cuando no hay inscripciones previas', () => {
      const out = checkPlayerTournamentLimits([], {
        teamId: 't1',
        categoryId: 'c1',
      });
      expect(out).toBeNull();
    });

    it('CATEGORY_DUPLICATE — RN-007 — mismo categoryId, distinto teamId', () => {
      const out = checkPlayerTournamentLimits(
        [{ registrationId: 'r1', teamId: 'tA', categoryId: 'c1' }],
        { teamId: 'tB', categoryId: 'c1' },
      );
      expect(out).toEqual({ kind: 'CATEGORY_DUPLICATE', conflictingTeamId: 'tA' });
    });

    it('TOURNAMENT_LIMIT_EXCEEDED — RN-038 — ya tiene 2 equipos distintos', () => {
      const out = checkPlayerTournamentLimits(
        [
          { registrationId: 'r1', teamId: 'tA', categoryId: 'c1' },
          { registrationId: 'r2', teamId: 'tB', categoryId: 'c2' },
        ],
        { teamId: 'tC', categoryId: 'c3' },
      );
      expect(out).toEqual({ kind: 'TOURNAMENT_LIMIT_EXCEEDED', teamCount: 2 });
    });

    it('OK — sumar a un equipo donde ya está', () => {
      const out = checkPlayerTournamentLimits(
        [
          { registrationId: 'r1', teamId: 'tA', categoryId: 'c1' },
          { registrationId: 'r2', teamId: 'tB', categoryId: 'c2' },
        ],
        { teamId: 'tA', categoryId: 'c1' },
      );
      expect(out).toBeNull();
    });

    it('OK — segundo equipo en categoría distinta', () => {
      const out = checkPlayerTournamentLimits(
        [{ registrationId: 'r1', teamId: 'tA', categoryId: 'c1' }],
        { teamId: 'tB', categoryId: 'c2' },
      );
      expect(out).toBeNull();
    });
  });

  describe('isAlreadyOverLimit', () => {
    it('false con ≤2 equipos distintos y sin duplicado en categoría', () => {
      expect(
        isAlreadyOverLimit([
          { registrationId: 'r1', teamId: 'tA', categoryId: 'c1' },
          { registrationId: 'r2', teamId: 'tB', categoryId: 'c2' },
        ]),
      ).toBe(false);
    });

    it('true cuando hay 3+ equipos', () => {
      expect(
        isAlreadyOverLimit([
          { registrationId: 'r1', teamId: 'tA', categoryId: 'c1' },
          { registrationId: 'r2', teamId: 'tB', categoryId: 'c2' },
          { registrationId: 'r3', teamId: 'tC', categoryId: 'c3' },
        ]),
      ).toBe(true);
    });

    it('true cuando hay duplicado en misma categoría', () => {
      expect(
        isAlreadyOverLimit([
          { registrationId: 'r1', teamId: 'tA', categoryId: 'c1' },
          { registrationId: 'r2', teamId: 'tB', categoryId: 'c1' },
        ]),
      ).toBe(true);
    });
  });
});
