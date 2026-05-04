import { validateTournamentWindows } from './date-windows.rules';

describe('validateTournamentWindows', () => {
  it('devuelve null cuando todas las ventanas son válidas', () => {
    expect(
      validateTournamentWindows({
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-12-31T00:00:00Z',
        registrationStartDate: '2026-04-01T00:00:00Z',
        registrationEndDate: '2026-05-31T00:00:00Z',
      }),
    ).toBeNull();
  });

  it('rechaza cuando startDate > endDate', () => {
    const err = validateTournamentWindows({
      startDate: '2026-12-31T00:00:00Z',
      endDate: '2026-06-01T00:00:00Z',
    });
    expect(err?.field).toBe('tournament');
  });

  it('rechaza cuando registrationStart > registrationEnd', () => {
    const err = validateTournamentWindows({
      registrationStartDate: '2026-05-31T00:00:00Z',
      registrationEndDate: '2026-04-01T00:00:00Z',
    });
    expect(err?.field).toBe('registration');
  });

  it('rechaza cuando teamOperationsOpenAt > teamOperationsCloseAt', () => {
    const err = validateTournamentWindows({
      teamOperationsOpenAt: '2026-07-01T00:00:00Z',
      teamOperationsCloseAt: '2026-06-01T00:00:00Z',
    });
    expect(err?.field).toBe('teamOperations');
  });

  it('acepta combinaciones parciales (sólo un par definido)', () => {
    expect(
      validateTournamentWindows({
        startDate: '2026-06-01T00:00:00Z',
      }),
    ).toBeNull();
  });

  it('acepta Date objects además de strings', () => {
    const err = validateTournamentWindows({
      startDate: new Date('2026-12-31T00:00:00Z'),
      endDate: new Date('2026-06-01T00:00:00Z'),
    });
    expect(err?.field).toBe('tournament');
  });
});
