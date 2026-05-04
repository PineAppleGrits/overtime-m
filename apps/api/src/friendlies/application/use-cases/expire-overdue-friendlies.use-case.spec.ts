import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../../../common/events';
import { IFriendlyDepositService } from '../ports/friendly-deposit-service.port';
import { IFriendlyRepository } from '../ports/friendly-repository.port';
import { ExpireOverdueFriendliesUseCase } from './expire-overdue-friendlies.use-case';

const buildOverdue = (id: string, deadline: Date) => ({
  id,
  sportId: 'sport-1',
  modality: '5v5',
  homeTeamId: 'team-A',
  awayTeamId: 'team-B',
  proposedDate: new Date(),
  venueId: null,
  status: 'GENERATED' as any,
  notes: null,
  confirmationDeadline: deadline,
  resultingMatchId: null,
  observedForCategorization: false,
  createdByProfileId: 'p-creator',
  generatedByProfileId: 'admin',
  generatedAt: new Date(),
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  debts: [],
});

describe('ExpireOverdueFriendliesUseCase', () => {
  it('marca como EXPIRED y emite evento por cada amistoso vencido', async () => {
    const now = new Date('2026-05-02T15:00:00Z');
    const overdue = [
      buildOverdue('f-1', new Date('2026-05-02T14:00:00Z')),
      buildOverdue('f-2', new Date('2026-05-02T13:00:00Z')),
    ];
    const repo = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findOverduePending: jest.fn().mockResolvedValue(overdue),
      updateState: jest.fn().mockImplementation(async (id, patch) => ({
        ...overdue.find((o) => o.id === id)!,
        ...patch,
      })),
      confirmWithMatch: jest.fn(),
    } as unknown as jest.Mocked<IFriendlyRepository>;

    const deposits = {
      createDeposits: jest.fn(),
      cancelDepositsForFriendly: jest.fn().mockResolvedValue(undefined),
      findDepositById: jest.fn(),
      listByFriendly: jest.fn(),
    } as jest.Mocked<IFriendlyDepositService>;

    const emitter = {
      emit: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<EventEmitter2>;

    const useCase = new ExpireOverdueFriendliesUseCase(repo, deposits, emitter);
    const result = await useCase.execute(now);

    expect(result.expiredCount).toBe(2);
    expect(result.expiredIds).toEqual(['f-1', 'f-2']);
    expect(deposits.cancelDepositsForFriendly).toHaveBeenCalledTimes(2);
    expect(repo.updateState).toHaveBeenCalledWith(
      'f-1',
      expect.objectContaining({ status: 'EXPIRED' }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.FRIENDLY_EXPIRED,
      expect.objectContaining({ friendlyId: 'f-1' }),
    );
  });

  it('continúa procesando aunque uno falle', async () => {
    const now = new Date('2026-05-02T15:00:00Z');
    const overdue = [
      buildOverdue('f-1', new Date('2026-05-02T14:00:00Z')),
      buildOverdue('f-2', new Date('2026-05-02T13:00:00Z')),
    ];
    const repo = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findOverduePending: jest.fn().mockResolvedValue(overdue),
      updateState: jest.fn().mockImplementationOnce(async () => {
        throw new Error('DB error');
      }).mockImplementationOnce(async (id, patch) => ({
        ...overdue.find((o) => o.id === id)!,
        ...patch,
      })),
      confirmWithMatch: jest.fn(),
    } as unknown as jest.Mocked<IFriendlyRepository>;

    const deposits = {
      createDeposits: jest.fn(),
      cancelDepositsForFriendly: jest.fn().mockResolvedValue(undefined),
      findDepositById: jest.fn(),
      listByFriendly: jest.fn(),
    } as jest.Mocked<IFriendlyDepositService>;

    const emitter = {
      emit: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<EventEmitter2>;

    const useCase = new ExpireOverdueFriendliesUseCase(repo, deposits, emitter);
    const result = await useCase.execute(now);

    // El primero falló pero el segundo se procesa.
    expect(result.expiredCount).toBe(1);
    expect(result.expiredIds).toEqual(['f-2']);
  });

  it('no procesa amistosos cuya deadline aún no venció (race guard)', async () => {
    const now = new Date('2026-05-02T15:00:00Z');
    // El repo (incorrectamente) devolvió uno con deadline en el futuro:
    // doble guarda en el use-case.
    const overdue = [buildOverdue('f-1', new Date('2026-05-02T16:00:00Z'))];
    const repo = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findOverduePending: jest.fn().mockResolvedValue(overdue),
      updateState: jest.fn(),
      confirmWithMatch: jest.fn(),
    } as unknown as jest.Mocked<IFriendlyRepository>;

    const deposits = {
      createDeposits: jest.fn(),
      cancelDepositsForFriendly: jest.fn(),
      findDepositById: jest.fn(),
      listByFriendly: jest.fn(),
    } as jest.Mocked<IFriendlyDepositService>;

    const emitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    const useCase = new ExpireOverdueFriendliesUseCase(repo, deposits, emitter);
    const result = await useCase.execute(now);
    expect(result.expiredCount).toBe(0);
    expect(repo.updateState).not.toHaveBeenCalled();
  });
});
