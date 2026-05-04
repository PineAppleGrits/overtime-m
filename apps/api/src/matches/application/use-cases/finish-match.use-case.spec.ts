import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorCode } from '../../../common/errors';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import { IMatchRepository } from '../ports/match-repository.port';
import { FinishMatchUseCase } from './finish-match.use-case';

const baseMatch: Record<string, unknown> = {
  id: 'm-1',
  homeTeamId: 'home',
  awayTeamId: 'away',
  categoryId: 'cat-1',
  zoneId: null,
  venueId: null,
  matchDate: new Date('2026-06-01T18:00:00Z'),
  matchTime: null,
  status: 'en_curso',
  matchType: 'regular',
  homeScore: 0,
  awayScore: 0,
  costPerTeam: null,
  seriesId: null,
  seriesGameNumber: null,
  playoffStage: null,
  category: {
    id: 'cat-1',
    tournament: {
      id: 'tour-1',
      modality: '5v5',
      sport: { code: 'BASKETBALL' },
    },
  },
};

describe('FinishMatchUseCase', () => {
  const setup = () => {
    const repo = {
      findById: jest.fn(),
      findByIdWithSport: jest.fn().mockResolvedValue(baseMatch),
      updateRaw: jest
        .fn()
        .mockImplementation(async (id: string, data: Record<string, unknown>) => ({ ...baseMatch, ...data, id })),
      countConfirmedStaff: jest.fn(),
      findBySeriesId: jest.fn(),
    } as unknown as IMatchRepository;
    const events = new EventEmitter2();
    const useCase = new FinishMatchUseCase(repo, new SportRulesRegistry(), events);
    return { useCase, repo, events };
  };

  it('finaliza con score válido y emite match.finished con countsForStandings=true', async () => {
    const { useCase, events, repo } = setup();
    const spy = jest.spyOn(events, 'emit');
    await useCase.execute({ matchId: 'm-1', homeScore: 80, awayScore: 70 });
    expect(repo.updateRaw).toHaveBeenCalledWith(
      'm-1',
      expect.objectContaining({ status: 'finalizado', homeScore: 80, awayScore: 70 }),
    );
    expect(spy).toHaveBeenCalledWith(
      'match.finished',
      expect.objectContaining({
        matchId: 'm-1',
        countsForStandings: true,
        resolution: 'organic',
      }),
    );
  });

  it('acepta 0-0 (admin) pero emite countsForStandings=false (RN-024)', async () => {
    const { useCase, events } = setup();
    const spy = jest.spyOn(events, 'emit');
    await useCase.execute({ matchId: 'm-1', homeScore: 0, awayScore: 0 });
    expect(spy).toHaveBeenCalledWith(
      'match.finished',
      expect.objectContaining({ countsForStandings: false }),
    );
  });

  it('rechaza score negativo', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ matchId: 'm-1', homeScore: -1, awayScore: 0 }),
    ).rejects.toMatchObject({ code: ErrorCode.MATCH_INVALID_SCORE });
  });

  it('rechaza si el partido no está en_curso', async () => {
    const { useCase, repo } = setup();
    const scheduled: Record<string, unknown> = { ...baseMatch, status: 'programado' };
    (repo.findByIdWithSport as jest.Mock).mockResolvedValueOnce(scheduled);
    await expect(
      useCase.execute({ matchId: 'm-1', homeScore: 80, awayScore: 70 }),
    ).rejects.toMatchObject({
      code: ErrorCode.MATCH_INVALID_STATUS_TRANSITION,
    });
  });
});
