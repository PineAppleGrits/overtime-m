import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import {
  IPlayoffRepository,
  PlayoffSeriesRow,
} from '../ports/playoff-repository.port';
import { AdvanceOnWinnerUseCase } from './advance-on-winner.use-case';

const seriesRow = (
  overrides: Partial<PlayoffSeriesRow> = {},
): PlayoffSeriesRow => {
  const base: Record<string, unknown> = {
    id: 'series-1',
    categoryId: 'cat-1',
    round: 'QUARTERFINAL',
    bracketPosition: 1,
    format: 'BO1',
    homeTeamId: 'home',
    awayTeamId: 'away',
    feedsFromSeriesAId: null,
    feedsFromSeriesBId: null,
    winnerTeamId: null,
    status: 'READY',
    matchesDirect: [],
    feedsToA: [],
    feedsToB: [],
    homeTeam: null,
    awayTeam: null,
    winnerTeam: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return base as unknown as PlayoffSeriesRow;
};

describe('AdvanceOnWinnerUseCase', () => {
  const setup = (matchOverrides: Record<string, unknown> = {}, series = seriesRow()) => {
    const prismaMock = {
      match: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'm-1',
          seriesId: series.id,
          ...matchOverrides,
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            homeTeamId: 'home',
            awayTeamId: 'away',
            homeScore: 80,
            awayScore: 70,
            status: 'finalizado',
          },
        ]),
      },
    } as unknown as PrismaService;

    const repo: IPlayoffRepository = {
      findSeriesById: jest.fn().mockResolvedValue(series),
      findSeriesByCategory: jest.fn(),
      findSeriesFedByCompletedSeries: jest.fn().mockResolvedValue([]),
      markSeriesCompleted: jest.fn(),
      setSeriesStatus: jest.fn(),
      assignTeams: jest.fn(),
      hasPlayoffMatchesStarted: jest.fn(),
      countCompletedRegularMatches: jest.fn(),
      createSeriesMatches: jest.fn(),
      deleteSeriesMatches: jest.fn(),
    };
    const events = new EventEmitter2();
    const uc = new AdvanceOnWinnerUseCase(repo, prismaMock, events);
    return { uc, repo, events };
  };

  it('cuando una serie BO1 es ganada, marca COMPLETED y emite playoff.series.completed', async () => {
    const { uc, repo, events } = setup();
    const spy = jest.spyOn(events, 'emit');
    await uc.execute({ matchId: 'm-1' });
    expect(repo.markSeriesCompleted).toHaveBeenCalledWith('series-1', 'home');
    expect(spy).toHaveBeenCalledWith(
      'playoff.series.completed',
      expect.objectContaining({
        seriesId: 'series-1',
        winnerTeamId: 'home',
        loserTeamId: 'away',
      }),
    );
  });

  it('si el match no tiene seriesId, no hace nada', async () => {
    const { uc, repo } = setup({ seriesId: null });
    await uc.execute({ matchId: 'm-1' });
    expect(repo.markSeriesCompleted).not.toHaveBeenCalled();
  });

  it('propaga winner a la serie alimentada y la pone en READY si tiene ambos slots', async () => {
    const fed = seriesRow({
      id: 'series-2',
      round: 'SEMIFINAL',
      bracketPosition: 1,
      homeTeamId: null,
      awayTeamId: 'other-winner',
      feedsFromSeriesAId: 'series-1',
      feedsFromSeriesBId: null,
      status: 'PENDING',
      matchesDirect: [],
    });
    const { uc, repo } = setup({}, seriesRow());
    (repo.findSeriesFedByCompletedSeries as jest.Mock).mockResolvedValueOnce([
      fed,
    ]);
    await uc.execute({ matchId: 'm-1' });
    expect(repo.assignTeams).toHaveBeenCalledWith(
      'series-2',
      'home',
      'other-winner',
      'READY',
    );
    expect(repo.createSeriesMatches).toHaveBeenCalled();
  });
});
