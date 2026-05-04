import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../../../common/events';
import { IFriendlyDepositService } from '../ports/friendly-deposit-service.port';
import { IFriendlyMatchService } from '../ports/friendly-match.port';
import { IFriendlyRepository } from '../ports/friendly-repository.port';
import { HandleDepositPaidUseCase } from './handle-deposit-paid.use-case';

const baseFriendly = (status: 'GENERATED' | 'PENDING_CONFIRMATION') => ({
  id: 'f-1',
  sportId: 'sport-1',
  modality: '5v5',
  homeTeamId: 'team-A',
  awayTeamId: 'team-B',
  proposedDate: new Date('2026-06-01T20:00:00Z'),
  venueId: null,
  status,
  notes: null,
  confirmationDeadline: new Date('2026-05-02T20:00:00Z'),
  resultingMatchId: null,
  observedForCategorization: false,
  createdByProfileId: 'p-creator',
  generatedByProfileId: 'admin-1',
  generatedAt: new Date(),
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  debts: [],
});

const makeRepo = (status: 'GENERATED' | 'PENDING_CONFIRMATION') =>
  ({
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(baseFriendly(status)),
    list: jest.fn(),
    findOverduePending: jest.fn(),
    updateState: jest.fn().mockImplementation(async (id, patch) => ({
      ...baseFriendly(status),
      ...patch,
    })),
    confirmWithMatch: jest.fn().mockResolvedValue({
      ...baseFriendly(status),
      status: 'CONFIRMED',
      resultingMatchId: 'm-1',
    }),
  }) as unknown as jest.Mocked<IFriendlyRepository>;

const makeDeposits = (
  paidCount: 0 | 1 | 2,
  diffTeams = true,
): jest.Mocked<IFriendlyDepositService> => {
  const all = [
    { id: 'd-home', teamId: 'team-A', status: 'APPROVED' },
    { id: 'd-away', teamId: 'team-B', status: 'APPROVED' },
  ];
  if (paidCount >= 1) all[0].status = 'PAID';
  if (paidCount >= 2) {
    all[1].status = 'PAID';
    if (!diffTeams) all[1].teamId = 'team-A';
  }
  return {
    createDeposits: jest.fn(),
    cancelDepositsForFriendly: jest.fn(),
    findDepositById: jest.fn().mockResolvedValue({
      id: 'd-home',
      friendlyId: 'f-1',
      teamId: 'team-A',
      status: 'PAID',
      type: 'FRIENDLY_DEPOSIT',
    }),
    listByFriendly: jest.fn().mockResolvedValue(all),
  } as jest.Mocked<IFriendlyDepositService>;
};

const makeMatchService = (): jest.Mocked<IFriendlyMatchService> =>
  ({
    createFriendlyMatch: jest.fn().mockResolvedValue({ id: 'm-1' }),
  }) as jest.Mocked<IFriendlyMatchService>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({ emit: jest.fn().mockReturnValue(true) }) as unknown as jest.Mocked<EventEmitter2>;

describe('HandleDepositPaidUseCase', () => {
  it('ignora si el debt no existe o no es FRIENDLY_DEPOSIT', async () => {
    const repo = makeRepo('GENERATED');
    const deposits = makeDeposits(1);
    deposits.findDepositById.mockResolvedValueOnce(null);
    const useCase = new HandleDepositPaidUseCase(
      repo,
      deposits,
      makeMatchService(),
      makeEmitter(),
    );
    await useCase.execute({ debtId: 'unknown' });
    expect(repo.updateState).not.toHaveBeenCalled();
  });

  it('primer pago: pasa a PENDING_CONFIRMATION y emite friendly.deposit.paid', async () => {
    const repo = makeRepo('GENERATED');
    const deposits = makeDeposits(1);
    const matchSvc = makeMatchService();
    const emitter = makeEmitter();
    const useCase = new HandleDepositPaidUseCase(
      repo,
      deposits,
      matchSvc,
      emitter,
    );

    await useCase.execute({ debtId: 'd-home' });

    expect(repo.updateState).toHaveBeenCalledWith(
      'f-1',
      expect.objectContaining({ status: 'PENDING_CONFIRMATION' }),
    );
    expect(matchSvc.createFriendlyMatch).not.toHaveBeenCalled();
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.FRIENDLY_DEPOSIT_PAID,
      expect.objectContaining({ friendlyId: 'f-1' }),
    );
  });

  it('segundo pago: crea Match, confirma y emite friendly.confirmed', async () => {
    const repo = makeRepo('PENDING_CONFIRMATION');
    const deposits = makeDeposits(2);
    const matchSvc = makeMatchService();
    const emitter = makeEmitter();
    const useCase = new HandleDepositPaidUseCase(
      repo,
      deposits,
      matchSvc,
      emitter,
    );

    await useCase.execute({ debtId: 'd-away' });

    expect(matchSvc.createFriendlyMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        friendlyId: 'f-1',
        homeTeamId: 'team-A',
        awayTeamId: 'team-B',
      }),
    );
    expect(repo.confirmWithMatch).toHaveBeenCalledWith('f-1', 'm-1');
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.FRIENDLY_CONFIRMED,
      expect.objectContaining({ friendlyId: 'f-1', resultingMatchId: 'm-1' }),
    );
  });

  it('caso anómalo: 2 pagos del mismo equipo no confirma', async () => {
    const repo = makeRepo('GENERATED');
    const deposits = makeDeposits(2, false);
    const matchSvc = makeMatchService();
    const useCase = new HandleDepositPaidUseCase(
      repo,
      deposits,
      matchSvc,
      makeEmitter(),
    );
    await useCase.execute({ debtId: 'd-home' });
    expect(matchSvc.createFriendlyMatch).not.toHaveBeenCalled();
  });

  it('ignora cuando friendly ya está CONFIRMED', async () => {
    const repo = makeRepo('GENERATED');
    repo.findById.mockResolvedValueOnce({
      ...baseFriendly('GENERATED'),
      status: 'CONFIRMED' as never,
    });
    const useCase = new HandleDepositPaidUseCase(
      repo,
      makeDeposits(1),
      makeMatchService(),
      makeEmitter(),
    );
    await useCase.execute({ debtId: 'd-home' });
    expect(repo.updateState).not.toHaveBeenCalled();
  });
});
