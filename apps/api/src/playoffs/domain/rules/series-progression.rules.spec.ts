import { computeSeriesProgress } from './series-progression.rules';

describe('computeSeriesProgress', () => {
  const home = 'team-A';
  const away = 'team-B';

  it('BO1 con winner orgánico cierra la serie', () => {
    const p = computeSeriesProgress(home, away, 'BO1', [
      {
        homeTeamId: home,
        awayTeamId: away,
        homeScore: 80,
        awayScore: 60,
        countsForStandings: true,
        status: 'finalizado',
      },
    ]);
    expect(p.isCompleted).toBe(true);
    expect(p.winnerTeamId).toBe(home);
    expect(p.loserTeamId).toBe(away);
    expect(p.needsTiebreaker).toBe(false);
  });

  it('BO1 0-0 administrativo → tiebreaker manual', () => {
    const p = computeSeriesProgress(home, away, 'BO1', [
      {
        homeTeamId: home,
        awayTeamId: away,
        homeScore: 0,
        awayScore: 0,
        countsForStandings: false,
        status: 'finalizado',
      },
    ]);
    expect(p.isCompleted).toBe(false);
    expect(p.winnerTeamId).toBe(null);
    expect(p.needsTiebreaker).toBe(true);
  });

  it('BO3 con 2 victorias del home cierra la serie', () => {
    const p = computeSeriesProgress(home, away, 'BO3', [
      {
        homeTeamId: home,
        awayTeamId: away,
        homeScore: 80,
        awayScore: 70,
        countsForStandings: true,
        status: 'finalizado',
      },
      {
        homeTeamId: away,
        awayTeamId: home,
        homeScore: 70,
        awayScore: 90, // home (visitante) ganó este juego
        countsForStandings: true,
        status: 'finalizado',
      },
    ]);
    expect(p.homeWins).toBe(2);
    expect(p.isCompleted).toBe(true);
    expect(p.winnerTeamId).toBe(home);
  });

  it('BO5 con serie 1-1 todavía no cierra', () => {
    const p = computeSeriesProgress(home, away, 'BO5', [
      {
        homeTeamId: home,
        awayTeamId: away,
        homeScore: 90,
        awayScore: 70,
        countsForStandings: true,
        status: 'finalizado',
      },
      {
        homeTeamId: home,
        awayTeamId: away,
        homeScore: 60,
        awayScore: 80,
        countsForStandings: true,
        status: 'finalizado',
      },
    ]);
    expect(p.isCompleted).toBe(false);
    expect(p.homeWins).toBe(1);
    expect(p.awayWins).toBe(1);
  });
});
