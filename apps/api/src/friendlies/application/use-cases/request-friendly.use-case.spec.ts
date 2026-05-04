import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { IFriendlyContext } from '../ports/friendly-context.port';
import { IFriendlyRepository } from '../ports/friendly-repository.port';
import { RequestFriendlyUseCase } from './request-friendly.use-case';

const makeRepoMock = (): jest.Mocked<IFriendlyRepository> =>
  ({
    create: jest.fn().mockImplementation(async (input) => ({
      id: 'f-1',
      ...input,
      debts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      confirmationDeadline: null,
      resultingMatchId: null,
      observedForCategorization: false,
      generatedByProfileId: null,
      generatedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      venueId: input.venueId ?? null,
      notes: input.notes ?? null,
    })),
    findById: jest.fn(),
    list: jest.fn(),
    findOverduePending: jest.fn(),
    updateState: jest.fn(),
    confirmWithMatch: jest.fn(),
  }) as jest.Mocked<IFriendlyRepository>;

const makeContextMock = (
  config: {
    teams?: { id: string; sportId: string; name?: string }[];
    isDelegate?: boolean;
  } = {},
): jest.Mocked<IFriendlyContext> =>
  ({
    findTeamsByIds: jest.fn().mockResolvedValue(
      (config.teams ?? []).map((t) => ({
        id: t.id,
        name: t.name ?? `Team ${t.id}`,
        sportId: t.sportId,
        creatorProfileId: 'creator-' + t.id,
        captainProfileId: null,
      })),
    ),
    findDelegatesForTeam: jest.fn().mockResolvedValue([]),
    isDelegateOfTeam: jest.fn().mockResolvedValue(config.isDelegate ?? true),
    findTeamsWhereDelegate: jest.fn().mockResolvedValue([]),
  }) as jest.Mocked<IFriendlyContext>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('RequestFriendlyUseCase', () => {
  const baseInput = {
    homeTeamId: 'team-A',
    awayTeamId: 'team-B',
    modality: '5v5' as const,
    proposedDate: new Date('2026-06-01T20:00:00Z'),
    requestedByProfileId: 'profile-1',
  };

  it('crea el amistoso y emite friendly.requested', async () => {
    const repo = makeRepoMock();
    const ctx = makeContextMock({
      teams: [
        { id: 'team-A', sportId: 'sport-1' },
        { id: 'team-B', sportId: 'sport-1' },
      ],
      isDelegate: true,
    });
    const emitter = makeEmitter();
    const useCase = new RequestFriendlyUseCase(repo, ctx, emitter);

    const result = await useCase.execute(baseInput);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        homeTeamId: 'team-A',
        awayTeamId: 'team-B',
        sportId: 'sport-1',
        status: 'REQUESTED',
        createdByProfileId: 'profile-1',
      }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.FRIENDLY_REQUESTED,
      expect.objectContaining({ friendlyId: 'f-1', createdBy: 'profile-1' }),
    );
    expect(result.id).toBe('f-1');
  });

  it('rechaza si home y away son el mismo equipo', async () => {
    const useCase = new RequestFriendlyUseCase(
      makeRepoMock(),
      makeContextMock(),
      makeEmitter(),
    );
    await expect(
      useCase.execute({ ...baseInput, awayTeamId: baseInput.homeTeamId }),
    ).rejects.toThrow(BusinessError);
  });

  it('rechaza si los deportes no coinciden', async () => {
    const ctx = makeContextMock({
      teams: [
        { id: 'team-A', sportId: 'sport-1' },
        { id: 'team-B', sportId: 'sport-2' },
      ],
      isDelegate: true,
    });
    const useCase = new RequestFriendlyUseCase(
      makeRepoMock(),
      ctx,
      makeEmitter(),
    );
    await expect(useCase.execute(baseInput)).rejects.toThrow(BusinessError);
  });

  it('rechaza si el solicitante no es delegado y bypassDelegateCheck=false', async () => {
    const ctx = makeContextMock({
      teams: [
        { id: 'team-A', sportId: 'sport-1' },
        { id: 'team-B', sportId: 'sport-1' },
      ],
      isDelegate: false,
    });
    const useCase = new RequestFriendlyUseCase(
      makeRepoMock(),
      ctx,
      makeEmitter(),
    );
    await expect(useCase.execute(baseInput)).rejects.toThrow(BusinessError);
  });

  it('admite la creación admin manual con bypassDelegateCheck=true', async () => {
    const repo = makeRepoMock();
    const ctx = makeContextMock({
      teams: [
        { id: 'team-A', sportId: 'sport-1' },
        { id: 'team-B', sportId: 'sport-1' },
      ],
      isDelegate: false,
    });
    const useCase = new RequestFriendlyUseCase(repo, ctx, makeEmitter());

    await useCase.execute({ ...baseInput, bypassDelegateCheck: true });
    expect(repo.create).toHaveBeenCalled();
    expect(ctx.isDelegateOfTeam).not.toHaveBeenCalled();
  });

  it('rechaza con NOT_FOUND si los equipos no existen', async () => {
    const ctx = makeContextMock({ teams: [] });
    const useCase = new RequestFriendlyUseCase(
      makeRepoMock(),
      ctx,
      makeEmitter(),
    );
    await expect(useCase.execute(baseInput)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });
  });
});
