import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { IFriendlyContext } from '../ports/friendly-context.port';
import { IFriendlyDepositService } from '../ports/friendly-deposit-service.port';
import { IFriendlyNotifier } from '../ports/friendly-notifier.port';
import { IFriendlyRepository } from '../ports/friendly-repository.port';
import { GenerateFriendlyUseCase } from './generate-friendly.use-case';

const baseFriendly = {
  id: 'f-1',
  sportId: 'sport-1',
  modality: '5v5',
  homeTeamId: 'team-A',
  awayTeamId: 'team-B',
  proposedDate: new Date('2026-06-01T20:00:00Z'),
  venueId: null,
  status: 'REQUESTED' as const,
  notes: null,
  confirmationDeadline: null,
  resultingMatchId: null,
  observedForCategorization: false,
  createdByProfileId: 'p-creator',
  generatedByProfileId: null,
  generatedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date('2026-05-01'),
  updatedAt: new Date('2026-05-01'),
  deletedAt: null,
  debts: [],
};

const makeRepo = (
  status: any = 'REQUESTED',
): jest.Mocked<IFriendlyRepository> =>
  ({
    create: jest.fn(),
    findById: jest
      .fn()
      .mockResolvedValue({ ...baseFriendly, status }) as never,
    list: jest.fn(),
    findOverduePending: jest.fn(),
    updateState: jest.fn().mockImplementation(async (id, patch) => ({
      ...baseFriendly,
      ...patch,
    })),
    confirmWithMatch: jest.fn(),
  }) as jest.Mocked<IFriendlyRepository>;

const makeDeposits = (): jest.Mocked<IFriendlyDepositService> =>
  ({
    createDeposits: jest.fn().mockResolvedValue({
      home: { id: 'd-home', teamId: 'team-A', status: 'APPROVED' },
      away: { id: 'd-away', teamId: 'team-B', status: 'APPROVED' },
    }),
    cancelDepositsForFriendly: jest.fn(),
    findDepositById: jest.fn(),
    listByFriendly: jest.fn(),
  }) as jest.Mocked<IFriendlyDepositService>;

const makeContext = (): jest.Mocked<IFriendlyContext> =>
  ({
    findTeamsByIds: jest.fn().mockResolvedValue([
      {
        id: 'team-A',
        name: 'Lakers',
        sportId: 'sport-1',
        creatorProfileId: 'p-creator',
        captainProfileId: null,
      },
      {
        id: 'team-B',
        name: 'Celtics',
        sportId: 'sport-1',
        creatorProfileId: 'p-other',
        captainProfileId: null,
      },
    ]),
    findDelegatesForTeam: jest.fn().mockImplementation(async (teamId) => [
      {
        profileId: `creator-${teamId}`,
        email: `${teamId}@x.com`,
        name: `Delegate ${teamId}`,
      },
    ]),
    isDelegateOfTeam: jest.fn(),
    findTeamsWhereDelegate: jest.fn(),
  }) as jest.Mocked<IFriendlyContext>;

const makeNotifier = (): jest.Mocked<IFriendlyNotifier> =>
  ({
    notifyGenerated: jest.fn().mockResolvedValue(undefined),
  }) as jest.Mocked<IFriendlyNotifier>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({ emit: jest.fn().mockReturnValue(true) }) as unknown as jest.Mocked<EventEmitter2>;

describe('GenerateFriendlyUseCase', () => {
  it('crea 2 debts, actualiza el friendly y emite friendly.generated', async () => {
    const repo = makeRepo('REQUESTED');
    const deposits = makeDeposits();
    const ctx = makeContext();
    const notifier = makeNotifier();
    const emitter = makeEmitter();
    const useCase = new GenerateFriendlyUseCase(
      repo,
      deposits,
      ctx,
      notifier,
      emitter,
    );

    const result = await useCase.execute({
      friendlyId: 'f-1',
      depositAmount: 5000,
      generatedByProfileId: 'admin-1',
    });

    expect(deposits.createDeposits).toHaveBeenCalledWith(
      expect.objectContaining({
        friendlyId: 'f-1',
        homeTeamId: 'team-A',
        awayTeamId: 'team-B',
        depositAmount: 5000,
        createdByProfileId: 'admin-1',
      }),
    );
    expect(repo.updateState).toHaveBeenCalledWith(
      'f-1',
      expect.objectContaining({
        status: 'GENERATED',
        generatedByProfileId: 'admin-1',
      }),
    );
    expect(notifier.notifyGenerated).toHaveBeenCalled();
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.FRIENDLY_GENERATED,
      expect.objectContaining({ friendlyId: 'f-1', generatedBy: 'admin-1' }),
    );
    expect(result.status).toBe('GENERATED');
  });

  it('aplica deadline = now + 24h por defecto', async () => {
    const repo = makeRepo('REQUESTED');
    const deposits = makeDeposits();
    const useCase = new GenerateFriendlyUseCase(
      repo,
      deposits,
      makeContext(),
      makeNotifier(),
      makeEmitter(),
    );

    const before = Date.now();
    await useCase.execute({
      friendlyId: 'f-1',
      depositAmount: 5000,
      generatedByProfileId: 'admin-1',
    });
    const after = Date.now();

    const call = deposits.createDeposits.mock.calls[0][0];
    const deadline = call.dueDate.getTime();
    expect(deadline).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
    expect(deadline).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 100);
  });

  it('rechaza si el friendly no está en estado válido para generar', async () => {
    const repo = makeRepo('CONFIRMED');
    const useCase = new GenerateFriendlyUseCase(
      repo,
      makeDeposits(),
      makeContext(),
      makeNotifier(),
      makeEmitter(),
    );
    await expect(
      useCase.execute({
        friendlyId: 'f-1',
        depositAmount: 5000,
        generatedByProfileId: 'admin-1',
      }),
    ).rejects.toThrow(BusinessError);
  });

  it('rechaza si depositAmount es <= 0', async () => {
    const useCase = new GenerateFriendlyUseCase(
      makeRepo('REQUESTED'),
      makeDeposits(),
      makeContext(),
      makeNotifier(),
      makeEmitter(),
    );
    await expect(
      useCase.execute({
        friendlyId: 'f-1',
        depositAmount: 0,
        generatedByProfileId: 'admin-1',
      }),
    ).rejects.toThrow(BusinessError);
  });

  it('rechaza con NOT_FOUND si el friendly no existe', async () => {
    const repo = makeRepo('REQUESTED');
    repo.findById.mockResolvedValueOnce(null);
    const useCase = new GenerateFriendlyUseCase(
      repo,
      makeDeposits(),
      makeContext(),
      makeNotifier(),
      makeEmitter(),
    );
    await expect(
      useCase.execute({
        friendlyId: 'missing',
        depositAmount: 5000,
        generatedByProfileId: 'admin-1',
      }),
    ).rejects.toThrow(BusinessError);
  });
});
