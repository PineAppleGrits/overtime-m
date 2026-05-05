import { EventEmitter2 } from '@nestjs/event-emitter';
import { AddFechaCumplidaUseCase } from './add-fecha-cumplida.use-case';
import { Sanction, SanctionProps } from '../../domain/entities/sanction.entity';
import { ISanctionRepository } from '../ports/sanction-repository.port';

function makeSanction(overrides: Partial<SanctionProps> = {}, withFechas?: number) {
  const s = new Sanction({
    id: 's1',
    targetType: 'PROFILE',
    targetProfileId: 'p1',
    targetTeamId: null,
    kind: 'DISCIPLINARY',
    status: 'ACTIVE',
    reason: 'r',
    notes: null,
    attachmentUrls: [],
    matchId: null,
    tournamentId: 't1',
    categoryId: null,
    startsAt: null,
    endsAt: null,
    amount: null,
    currency: 'ARS',
    createdByProfileId: 'admin',
    resolvedByProfileId: null,
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  if (withFechas) s.initFechas(withFechas);
  return s;
}

describe('AddFechaCumplidaUseCase', () => {
  it('suma 1 fecha a las sanciones DISCIPLINARY del profile que matchean torneo', async () => {
    const sanction = makeSanction({}, 3);
    const repo: ISanctionRepository = {
      findActiveForProfile: jest.fn().mockResolvedValue([sanction]),
      save: jest.fn().mockImplementation(async (s) => s),
      // unused
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findActiveForTeam: jest.fn(),
      addAttachmentUrl: jest.fn(),
    };
    const emitter = new EventEmitter2();
    const emitSpy = jest.spyOn(emitter, 'emit');

    const uc = new AddFechaCumplidaUseCase(repo, emitter);

    await uc.execute({
      profileId: 'p1',
      matchId: 'm1',
      tournamentId: 't1',
      delta: 1,
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(sanction.readFechas()).toEqual({ totalFechas: 3, fechasCumplidas: 1 });
    expect(emitSpy).toHaveBeenCalledWith(
      'sanction.fechaCumplida.added',
      expect.objectContaining({ sanctionId: 's1', autoResolved: false }),
    );
  });

  it('auto-resuelve cuando llega al total y emite sanction.resolved', async () => {
    const sanction = makeSanction({}, 1);
    const repo: ISanctionRepository = {
      findActiveForProfile: jest.fn().mockResolvedValue([sanction]),
      save: jest.fn().mockImplementation(async (s) => s),
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findActiveForTeam: jest.fn(),
      addAttachmentUrl: jest.fn(),
    };
    const emitter = new EventEmitter2();
    const emitSpy = jest.spyOn(emitter, 'emit');

    const uc = new AddFechaCumplidaUseCase(repo, emitter);

    await uc.execute({ profileId: 'p1', matchId: 'm', tournamentId: 't1' });

    expect(sanction.status).toBe('RESOLVED');
    expect(emitSpy).toHaveBeenCalledWith(
      'sanction.fechaCumplida.added',
      expect.objectContaining({ autoResolved: true }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      'sanction.resolved',
      expect.objectContaining({ sanctionId: 's1' }),
    );
  });

  it('skipea sanciones de otro torneo', async () => {
    const sanction = makeSanction({ tournamentId: 'OTRO' }, 3);
    const repo: ISanctionRepository = {
      findActiveForProfile: jest.fn().mockResolvedValue([sanction]),
      save: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findActiveForTeam: jest.fn(),
      addAttachmentUrl: jest.fn(),
    };
    const emitter = new EventEmitter2();

    const uc = new AddFechaCumplidaUseCase(repo, emitter);

    await uc.execute({ profileId: 'p1', matchId: 'm', tournamentId: 't1' });

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('skipea sanciones MONETARY', async () => {
    const sanction = makeSanction({ kind: 'MONETARY' }, 3);
    const repo: ISanctionRepository = {
      findActiveForProfile: jest.fn().mockResolvedValue([sanction]),
      save: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findActiveForTeam: jest.fn(),
      addAttachmentUrl: jest.fn(),
    };
    const uc = new AddFechaCumplidaUseCase(repo, new EventEmitter2());
    await uc.execute({ profileId: 'p1', matchId: 'm', tournamentId: 't1' });
    expect(repo.save).not.toHaveBeenCalled();
  });
});
