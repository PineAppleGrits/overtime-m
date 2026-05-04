import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorCode } from '../../../common/errors';
import { IMatchRepository } from '../ports/match-repository.port';
import { CancelMatchByTeamUseCase } from './cancel-match-by-team.use-case';

const buildMatch = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
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
  category: {
    id: 'cat-1',
    tournament: {
      id: 'tour-1',
      modality: '5v5',
      earlyCancellationThresholdHours: null,
    },
  },
  ...overrides,
});

describe('CancelMatchByTeamUseCase', () => {
  const setup = (matchOverrides: Record<string, unknown> = {}) => {
    const repo = {
      findById: jest.fn().mockResolvedValue(buildMatch(matchOverrides)),
      findByIdWithSport: jest.fn(),
      updateRaw: jest
        .fn()
        .mockImplementation(async (_id: string, data: Record<string, unknown>) =>
          buildMatch(data),
        ),
      countConfirmedStaff: jest.fn(),
      findBySeriesId: jest.fn(),
    } as unknown as IMatchRepository;
    const events = new EventEmitter2();
    const uc = new CancelMatchByTeamUseCase(repo, events);
    return { uc, repo, events };
  };

  it('a 100hs (>72hs, sin umbral) deja en pending_rival_decision', async () => {
    const { uc, events } = setup();
    const spy = jest.spyOn(events, 'emit');
    const now = new Date('2026-06-06T14:00:00Z'); // ~100h antes
    const result = await uc.execute({
      matchId: 'm-1',
      cancellingTeamId: 'home',
      reason: 'no podemos',
      now,
    });
    expect(result.outcome).toBe('rival_decision');
    expect(spy).toHaveBeenCalledWith(
      'match.cancelled',
      expect.objectContaining({ requiresRivalDecision: true }),
    );
  });

  it('a 50hs (<72hs) lanza MATCH_CANCEL_WINDOW_EXPIRED', async () => {
    const { uc } = setup();
    const now = new Date('2026-06-08T16:00:00Z');
    await expect(
      uc.execute({ matchId: 'm-1', cancellingTeamId: 'home', now }),
    ).rejects.toMatchObject({ code: ErrorCode.MATCH_CANCEL_WINDOW_EXPIRED });
  });

  it('si la antelación supera el umbral del torneo, reprograma directo (RN-052)', async () => {
    const { uc, events } = setup({
      category: {
        id: 'cat-1',
        tournament: {
          id: 'tour-1',
          modality: '5v5',
          earlyCancellationThresholdHours: 96,
        },
      },
    });
    const now = new Date('2026-06-05T18:00:00Z'); // 5 días = 120hs
    const spy = jest.spyOn(events, 'emit');
    const result = await uc.execute({
      matchId: 'm-1',
      cancellingTeamId: 'home',
      now,
    });
    expect(result.outcome).toBe('auto_reschedule');
    expect(spy).toHaveBeenCalledWith(
      'match.rescheduled',
      expect.objectContaining({ matchId: 'm-1' }),
    );
  });

  it('rechaza si el equipo no participa', async () => {
    const { uc } = setup();
    await expect(
      uc.execute({ matchId: 'm-1', cancellingTeamId: 'other-team' }),
    ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
  });
});
