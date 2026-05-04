import { ErrorCode } from '../../../common/errors';
import { IFriendlyRepository } from '../ports/friendly-repository.port';
import { ObserveForCategorizationUseCase } from './observe-for-categorization.use-case';

const baseRecord = (
  status: any,
  observed = false,
) => ({
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
  resultingMatchId: 'm-1',
  observedForCategorization: observed,
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

const makeRepo = (status: any, observed = false) =>
  ({
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(baseRecord(status, observed)),
    list: jest.fn(),
    findOverduePending: jest.fn(),
    updateState: jest.fn().mockImplementation(async (id, patch) => ({
      ...baseRecord(status, observed),
      ...patch,
    })),
    confirmWithMatch: jest.fn(),
  }) as unknown as jest.Mocked<IFriendlyRepository>;

describe('ObserveForCategorizationUseCase', () => {
  it('marca el flag en true para un amistoso PLAYED', async () => {
    const repo = makeRepo('PLAYED', false);
    const useCase = new ObserveForCategorizationUseCase(repo);
    const result = await useCase.execute({ friendlyId: 'f-1' });

    expect(repo.updateState).toHaveBeenCalledWith(
      'f-1',
      expect.objectContaining({ observedForCategorization: true }),
    );
    expect(result.observedForCategorization).toBe(true);
  });

  it('rechaza si no está PLAYED', async () => {
    const repo = makeRepo('CONFIRMED', false);
    const useCase = new ObserveForCategorizationUseCase(repo);
    await expect(
      useCase.execute({ friendlyId: 'f-1' }),
    ).rejects.toMatchObject({
      code: ErrorCode.FRIENDLY_INVALID_TRANSITION,
    });
  });

  it('idempotente: si ya está observed, no llama updateState', async () => {
    const repo = makeRepo('PLAYED', true);
    const useCase = new ObserveForCategorizationUseCase(repo);
    await useCase.execute({ friendlyId: 'f-1' });
    expect(repo.updateState).not.toHaveBeenCalled();
  });

  it('rechaza con NOT_FOUND si no existe', async () => {
    const repo = makeRepo('PLAYED');
    repo.findById.mockResolvedValueOnce(null);
    const useCase = new ObserveForCategorizationUseCase(repo);
    await expect(
      useCase.execute({ friendlyId: 'missing' }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});
