import 'reflect-metadata';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TournamentStatus } from '@overtime-mono/shared';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { ITournamentRepository } from '../ports/tournament-repository.port';
import { ChangeTournamentStatusUseCase } from './change-status.use-case';

const makeRepoMock = (
  initial: Partial<{ id: string; status: TournamentStatus; name: string }> = {},
): jest.Mocked<ITournamentRepository> =>
  ({
    findById: jest.fn().mockResolvedValue({
      id: initial.id ?? 't-1',
      status: initial.status ?? TournamentStatus.DRAFT,
      name: initial.name ?? 'Apertura',
    } as never),
    findBySlug: jest.fn(),
    findBySportId: jest.fn(),
    slugExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn().mockImplementation(
      async (id: string, status: TournamentStatus) =>
        ({ id, status, name: initial.name ?? 'Apertura' }) as never,
    ),
  }) as jest.Mocked<ITournamentRepository>;

const makeEmitterMock = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('ChangeTournamentStatusUseCase', () => {
  it('aplica transición válida y emite tournament.status.changed', async () => {
    const repo = makeRepoMock({ status: TournamentStatus.DRAFT });
    const emitter = makeEmitterMock();
    const useCase = new ChangeTournamentStatusUseCase(repo, emitter);

    await useCase.execute({
      tournamentId: 't-1',
      newStatus: TournamentStatus.OPEN,
    });

    expect(repo.updateStatus).toHaveBeenCalledWith('t-1', TournamentStatus.OPEN);
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.TOURNAMENT_STATUS_CHANGED,
      expect.objectContaining({
        tournamentId: 't-1',
        fromStatus: TournamentStatus.DRAFT,
        toStatus: TournamentStatus.OPEN,
      }),
    );
  });

  it('es no-op cuando el estado actual coincide con el nuevo', async () => {
    const repo = makeRepoMock({ status: TournamentStatus.OPEN });
    const emitter = makeEmitterMock();
    const useCase = new ChangeTournamentStatusUseCase(repo, emitter);

    await useCase.execute({
      tournamentId: 't-1',
      newStatus: TournamentStatus.OPEN,
    });

    expect(repo.updateStatus).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('lanza BusinessError(TOURNAMENT_INVALID_STATUS_TRANSITION) ante salto inválido', async () => {
    const repo = makeRepoMock({ status: TournamentStatus.DRAFT });
    const emitter = makeEmitterMock();
    const useCase = new ChangeTournamentStatusUseCase(repo, emitter);

    try {
      await useCase.execute({
        tournamentId: 't-1',
        newStatus: TournamentStatus.IN_PROGRESS,
      });
      fail('expected BusinessError');
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessError);
      expect((err as BusinessError).code).toBe(
        ErrorCode.TOURNAMENT_INVALID_STATUS_TRANSITION,
      );
    }

    expect(repo.updateStatus).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('lanza BusinessError(NOT_FOUND) cuando el torneo no existe', async () => {
    const repo = makeRepoMock();
    repo.findById.mockResolvedValue(null);
    const emitter = makeEmitterMock();
    const useCase = new ChangeTournamentStatusUseCase(repo, emitter);

    await expect(
      useCase.execute({
        tournamentId: 'missing',
        newStatus: TournamentStatus.OPEN,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it('rechaza CANCELLED desde FINISHED', async () => {
    const repo = makeRepoMock({ status: TournamentStatus.FINISHED });
    const useCase = new ChangeTournamentStatusUseCase(repo, makeEmitterMock());

    await expect(
      useCase.execute({
        tournamentId: 't-1',
        newStatus: TournamentStatus.CANCELLED,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.TOURNAMENT_INVALID_STATUS_TRANSITION,
    });
  });
});
