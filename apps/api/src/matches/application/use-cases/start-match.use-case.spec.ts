import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import { IMatchRepository } from '../ports/match-repository.port';
import { IDebtsCheckPort } from '../ports/debts-check.port';
import { IStaffCheckPort } from '../ports/staff-check.port';
import { StartMatchUseCase } from './start-match.use-case';

const baseMatch: Record<string, unknown> = {
  id: 'm-1',
  homeTeamId: 'home',
  awayTeamId: 'away',
  categoryId: 'cat-1',
  zoneId: null,
  venueId: null,
  matchDate: new Date('2026-06-01T18:00:00Z'),
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
      sport: { code: 'BASKETBALL' },
    },
  },
};

describe('StartMatchUseCase', () => {
  const setup = () => {
    const repo = {
      findById: jest.fn(),
      findByIdWithSport: jest.fn().mockResolvedValue(baseMatch),
      updateRaw: jest.fn().mockImplementation(async (id: string, data: Record<string, unknown>) => ({
        ...baseMatch,
        ...data,
        id,
      })),
      countConfirmedStaff: jest.fn(),
      findBySeriesId: jest.fn(),
    } as unknown as IMatchRepository;
    const debts: IDebtsCheckPort = {
      hasOutstandingDebts: jest.fn().mockResolvedValue(false),
    };
    const staff: IStaffCheckPort = {
      countConfirmedStaff: jest
        .fn()
        .mockResolvedValue({ referees: 1, tableOfficials: 1 }),
    };
    const registry = new SportRulesRegistry();
    const events = new EventEmitter2();
    const useCase = new StartMatchUseCase(repo, debts, staff, registry, events);
    return { useCase, repo, debts, staff, events };
  };

  it('inicia el partido cuando staff y deudas están OK', async () => {
    const { useCase, repo, events } = setup();
    const emitSpy = jest.spyOn(events, 'emit');
    const result = await useCase.execute({ matchId: 'm-1' });
    expect(result.status).toBe('en_curso');
    expect(repo.updateRaw).toHaveBeenCalledWith('m-1', { status: 'en_curso' });
    expect(emitSpy).toHaveBeenCalledWith('match.started', { matchId: 'm-1' });
  });

  it('falla con MATCH_STAFF_BELOW_MIN si falta staff (RN-049)', async () => {
    const { useCase, staff } = setup();
    (staff.countConfirmedStaff as jest.Mock).mockResolvedValueOnce({
      referees: 0,
      tableOfficials: 1,
    });
    await expect(useCase.execute({ matchId: 'm-1' })).rejects.toMatchObject({
      code: ErrorCode.MATCH_STAFF_BELOW_MIN,
    });
  });

  it('falla con MATCH_TEAM_HAS_OUTSTANDING_DEBT si un equipo debe (RN-053)', async () => {
    const { useCase, debts } = setup();
    (debts.hasOutstandingDebts as jest.Mock).mockResolvedValueOnce(true);
    await expect(useCase.execute({ matchId: 'm-1' })).rejects.toMatchObject({
      code: ErrorCode.MATCH_TEAM_HAS_OUTSTANDING_DEBT,
    });
  });

  it('falla con MATCH_INVALID_STATUS_TRANSITION si el estado no permite start', async () => {
    const { useCase, repo } = setup();
    const finalized: Record<string, unknown> = { ...baseMatch, status: 'finalizado' };
    (repo.findByIdWithSport as jest.Mock).mockResolvedValueOnce(finalized);
    await expect(useCase.execute({ matchId: 'm-1' })).rejects.toBeInstanceOf(
      BusinessError,
    );
  });
});
