import 'reflect-metadata';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TournamentStatus } from '@overtime-mono/shared';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { ITournamentRepository } from '../ports/tournament-repository.port';
import { ChangeTournamentStatusUseCase } from './change-status.use-case';

const makeRepoMock = (
  initial: Partial<{
    id: string;
    status: TournamentStatus;
    name: string;
    registrationStartDate: Date | null;
    registrationEndDate: Date | null;
  }> = {},
): jest.Mocked<ITournamentRepository> => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  return {
    findById: jest.fn().mockResolvedValue({
      id: initial.id ?? 't-1',
      status: initial.status ?? TournamentStatus.DRAFT,
      name: initial.name ?? 'Apertura',
      registrationStartDate:
        initial.registrationStartDate === undefined
          ? tomorrow
          : initial.registrationStartDate,
      registrationEndDate:
        initial.registrationEndDate === undefined
          ? inTenDays
          : initial.registrationEndDate,
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
    countCategories: jest.fn().mockResolvedValue(1),
    findCategoriesWithoutFixture: jest.fn().mockResolvedValue([]),
  } as jest.Mocked<ITournamentRepository>;
};

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
      newStatus: TournamentStatus.PUBLISHED,
    });

    expect(repo.updateStatus).toHaveBeenCalledWith(
      't-1',
      TournamentStatus.PUBLISHED,
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.TOURNAMENT_STATUS_CHANGED,
      expect.objectContaining({
        tournamentId: 't-1',
        fromStatus: TournamentStatus.DRAFT,
        toStatus: TournamentStatus.PUBLISHED,
      }),
    );
  });

  it('es no-op cuando el estado actual coincide con el nuevo', async () => {
    const repo = makeRepoMock({ status: TournamentStatus.INSCRIPTION_OPEN });
    const emitter = makeEmitterMock();
    const useCase = new ChangeTournamentStatusUseCase(repo, emitter);

    await useCase.execute({
      tournamentId: 't-1',
      newStatus: TournamentStatus.INSCRIPTION_OPEN,
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
        newStatus: TournamentStatus.PLAYING,
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
        newStatus: TournamentStatus.PUBLISHED,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it('rechaza pasar a FINISHED desde estados pre-PLAYING', async () => {
    const repo = makeRepoMock({ status: TournamentStatus.IN_PROGRESS });
    const useCase = new ChangeTournamentStatusUseCase(repo, makeEmitterMock());

    await expect(
      useCase.execute({
        tournamentId: 't-1',
        newStatus: TournamentStatus.FINISHED,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.TOURNAMENT_INVALID_STATUS_TRANSITION,
    });
  });

  describe('guards', () => {
    it('PUBLISHED requiere fechas de inscripción', async () => {
      const repo = makeRepoMock({
        status: TournamentStatus.DRAFT,
        registrationStartDate: null,
        registrationEndDate: null,
      });
      const useCase = new ChangeTournamentStatusUseCase(
        repo,
        makeEmitterMock(),
      );

      await expect(
        useCase.execute({
          tournamentId: 't-1',
          newStatus: TournamentStatus.PUBLISHED,
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.TOURNAMENT_PUBLISH_REQUIRES_DATES,
      });
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it('PUBLISHED requiere al menos una categoría', async () => {
      const repo = makeRepoMock({ status: TournamentStatus.DRAFT });
      repo.countCategories.mockResolvedValue(0);
      const useCase = new ChangeTournamentStatusUseCase(
        repo,
        makeEmitterMock(),
      );

      await expect(
        useCase.execute({
          tournamentId: 't-1',
          newStatus: TournamentStatus.PUBLISHED,
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.TOURNAMENT_PUBLISH_REQUIRES_CATEGORY,
      });
    });

    it('PLAYING rechaza si hay categorías sin fixture', async () => {
      const repo = makeRepoMock({ status: TournamentStatus.IN_PROGRESS });
      repo.findCategoriesWithoutFixture.mockResolvedValue([
        { id: 'c-1', name: 'A' },
      ]);
      const useCase = new ChangeTournamentStatusUseCase(
        repo,
        makeEmitterMock(),
      );

      await expect(
        useCase.execute({
          tournamentId: 't-1',
          newStatus: TournamentStatus.PLAYING,
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.FIXTURE_INCOMPLETE_FOR_START,
      });
    });

    it('PLAYING acepta cuando todas las categorías tienen fixture', async () => {
      const repo = makeRepoMock({ status: TournamentStatus.IN_PROGRESS });
      const useCase = new ChangeTournamentStatusUseCase(
        repo,
        makeEmitterMock(),
      );

      await useCase.execute({
        tournamentId: 't-1',
        newStatus: TournamentStatus.PLAYING,
      });

      expect(repo.updateStatus).toHaveBeenCalledWith(
        't-1',
        TournamentStatus.PLAYING,
      );
    });
  });
});
