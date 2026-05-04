import { EventEmitter2 } from '@nestjs/event-emitter';
import { IMatchRepository } from '../ports/match-repository.port';
import { RecordMutualCancelUseCase } from './record-mutual-cancel.use-case';

const baseMatch: Record<string, unknown> = {
  id: 'm-1',
  homeTeamId: 'home',
  awayTeamId: 'away',
  categoryId: 'cat-1',
  zoneId: null,
  venueId: null,
  matchDate: new Date('2026-06-10T18:00:00Z'),
  matchTime: null,
  status: 'programado',
  matchType: 'regular',
  homeScore: 0,
  awayScore: 0,
  costPerTeam: null,
  seriesId: null,
  seriesGameNumber: null,
  playoffStage: null,
};

describe('RecordMutualCancelUseCase', () => {
  it('deja status=finalizado, score 0-0 y emite match.finished con countsForStandings=false (RN-024/RN-056)', async () => {
    const finished: Record<string, unknown> = {
      ...baseMatch,
      status: 'finalizado',
      homeScore: 0,
      awayScore: 0,
    };
    const repo = {
      findById: jest.fn().mockResolvedValue(baseMatch),
      findByIdWithSport: jest.fn(),
      updateRaw: jest.fn().mockResolvedValue(finished),
      countConfirmedStaff: jest.fn(),
      findBySeriesId: jest.fn(),
    } as unknown as IMatchRepository;
    const events = new EventEmitter2();
    const spy = jest.spyOn(events, 'emit');
    const uc = new RecordMutualCancelUseCase(repo, events);
    await uc.execute({ matchId: 'm-1' });
    expect(repo.updateRaw).toHaveBeenCalledWith(
      'm-1',
      expect.objectContaining({
        status: 'finalizado',
        homeScore: 0,
        awayScore: 0,
      }),
    );
    expect(spy).toHaveBeenCalledWith(
      'match.finished',
      expect.objectContaining({
        homeScore: 0,
        awayScore: 0,
        countsForStandings: false,
        resolution: 'mutual_cancel',
      }),
    );
  });
});
