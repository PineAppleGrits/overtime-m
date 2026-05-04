import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { IFriendlyDepositService } from '../ports/friendly-deposit-service.port';
import { IFriendlyRepository } from '../ports/friendly-repository.port';
import { CancelFriendlyUseCase } from './cancel-friendly.use-case';

const makeRecord = (status: any) => ({
  id: 'f-1',
  sportId: 'sport-1',
  modality: '5v5',
  homeTeamId: 'team-A',
  awayTeamId: 'team-B',
  proposedDate: new Date(),
  venueId: null,
  status,
  notes: null,
  confirmationDeadline: null,
  resultingMatchId: null,
  observedForCategorization: false,
  createdByProfileId: 'p-creator',
  generatedByProfileId: null,
  generatedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  debts: [],
});

const makeRepo = (status: any) =>
  ({
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(makeRecord(status)),
    list: jest.fn(),
    findOverduePending: jest.fn(),
    updateState: jest.fn().mockImplementation(async (id, patch) => ({
      ...makeRecord(status),
      ...patch,
    })),
    confirmWithMatch: jest.fn(),
  }) as unknown as jest.Mocked<IFriendlyRepository>;

const makeDeposits = (): jest.Mocked<IFriendlyDepositService> =>
  ({
    createDeposits: jest.fn(),
    cancelDepositsForFriendly: jest.fn(),
    findDepositById: jest.fn(),
    listByFriendly: jest.fn(),
  }) as jest.Mocked<IFriendlyDepositService>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({ emit: jest.fn().mockReturnValue(true) }) as unknown as jest.Mocked<EventEmitter2>;

describe('CancelFriendlyUseCase', () => {
  it('admin puede cancelar un REQUESTED', async () => {
    const repo = makeRepo('REQUESTED');
    const deposits = makeDeposits();
    const emitter = makeEmitter();
    const useCase = new CancelFriendlyUseCase(repo, deposits, emitter);

    await useCase.execute({
      friendlyId: 'f-1',
      cancelledByProfileId: 'admin-1',
      reason: 'Solicitud retirada',
      isAdmin: true,
    });

    expect(deposits.cancelDepositsForFriendly).toHaveBeenCalledWith(
      'f-1',
      'Solicitud retirada',
    );
    expect(repo.updateState).toHaveBeenCalledWith(
      'f-1',
      expect.objectContaining({ status: 'CANCELLED' }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.FRIENDLY_CANCELLED,
      expect.objectContaining({ friendlyId: 'f-1' }),
    );
  });

  it('creator puede cancelar un GENERATED', async () => {
    const repo = makeRepo('GENERATED');
    const useCase = new CancelFriendlyUseCase(
      repo,
      makeDeposits(),
      makeEmitter(),
    );
    const result = await useCase.execute({
      friendlyId: 'f-1',
      cancelledByProfileId: 'p-creator',
      isAdmin: false,
    });
    expect(result.status).toBe('CANCELLED');
  });

  it('rechaza FORBIDDEN si no es admin ni creator', async () => {
    const repo = makeRepo('REQUESTED');
    const useCase = new CancelFriendlyUseCase(
      repo,
      makeDeposits(),
      makeEmitter(),
    );
    await expect(
      useCase.execute({
        friendlyId: 'f-1',
        cancelledByProfileId: 'random-user',
        isAdmin: false,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
  });

  it('rechaza si el amistoso ya está PLAYED', async () => {
    const repo = makeRepo('PLAYED');
    const useCase = new CancelFriendlyUseCase(
      repo,
      makeDeposits(),
      makeEmitter(),
    );
    await expect(
      useCase.execute({
        friendlyId: 'f-1',
        cancelledByProfileId: 'admin-1',
        isAdmin: true,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.FRIENDLY_INVALID_TRANSITION,
    });
  });

  it('rechaza con NOT_FOUND si el friendly no existe', async () => {
    const repo = makeRepo('REQUESTED');
    repo.findById.mockResolvedValueOnce(null);
    const useCase = new CancelFriendlyUseCase(
      repo,
      makeDeposits(),
      makeEmitter(),
    );
    await expect(
      useCase.execute({
        friendlyId: 'missing',
        cancelledByProfileId: 'admin-1',
        isAdmin: true,
      }),
    ).rejects.toThrow(BusinessError);
  });
});
