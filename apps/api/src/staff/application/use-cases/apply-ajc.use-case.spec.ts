import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { IDebtsPort } from '../ports/debts.port';
import { ISanctionsPort, SanctionRow } from '../ports/sanctions.port';
import { ApplyAjcUseCase } from './apply-ajc.use-case';

const makeSanction = (over: Partial<SanctionRow> = {}): SanctionRow => ({
  id: 'sanc-1',
  status: 'ACTIVE',
  kind: 'DISCIPLINARY',
  targetProfileId: 'p-1',
  startsAt: new Date('2026-01-01'),
  endsAt: new Date('2026-12-31'),
  notes: null,
  ...over,
});

const makeSanctionsPort = (
  over: Partial<jest.Mocked<ISanctionsPort>> = {},
): jest.Mocked<ISanctionsPort> => ({
  findById: jest.fn().mockResolvedValue(makeSanction()),
  markAjcApplied: jest.fn().mockResolvedValue(undefined),
  ...over,
});

const makeDebtsPort = (): jest.Mocked<IDebtsPort> => ({
  createAjcDebt: jest.fn().mockResolvedValue({
    id: 'debt-1',
    amount: 10000,
    status: 'APPROVED',
  }),
});

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('ApplyAjcUseCase (RN-030)', () => {
  it('happy path — calcula monto, crea debt y emite evento', async () => {
    const sanctionsPort = makeSanctionsPort();
    const debtsPort = makeDebtsPort();
    const emitter = makeEmitter();
    const uc = new ApplyAjcUseCase(sanctionsPort, debtsPort, emitter);

    const out = await uc.execute({
      profileId: 'p-1',
      sanctionId: 'sanc-1',
      refereeSalary: 5000,
      fechasToFree: 2,
      appliedByProfileId: 'admin-1',
    });

    expect(out.amount).toBe(10000);
    expect(out.fechasFreed).toBe(2);
    expect(debtsPort.createAjcDebt).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 'p-1',
        sanctionId: 'sanc-1',
        amount: 10000,
        refereeSalary: 5000,
        fechasFreed: 2,
        appliedByProfileId: 'admin-1',
      }),
    );
    expect(sanctionsPort.markAjcApplied).toHaveBeenCalled();
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.AJC_APPLIED,
      expect.objectContaining({
        sanctionId: 'sanc-1',
        profileId: 'p-1',
        debtId: 'debt-1',
        amount: 10000,
        fechasFreed: 2,
      }),
    );
  });

  it('rechaza si la sanción no existe', async () => {
    const sanctionsPort = makeSanctionsPort({
      findById: jest.fn().mockResolvedValue(null),
    });
    const uc = new ApplyAjcUseCase(sanctionsPort, makeDebtsPort(), makeEmitter());
    await expect(
      uc.execute({
        profileId: 'p-1',
        sanctionId: 'x',
        refereeSalary: 5000,
        fechasToFree: 2,
        appliedByProfileId: 'admin-1',
      }),
    ).rejects.toThrow(BusinessError);
  });

  it('rechaza si la sanción no es DISCIPLINARY', async () => {
    const sanctionsPort = makeSanctionsPort({
      findById: jest.fn().mockResolvedValue(makeSanction({ kind: 'MONETARY' })),
    });
    const uc = new ApplyAjcUseCase(sanctionsPort, makeDebtsPort(), makeEmitter());
    await expect(
      uc.execute({
        profileId: 'p-1',
        sanctionId: 'sanc-1',
        refereeSalary: 5000,
        fechasToFree: 2,
        appliedByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.AJC_INVALID_SANCTION });
  });

  it('rechaza si la sanción no está ACTIVE', async () => {
    const sanctionsPort = makeSanctionsPort({
      findById: jest.fn().mockResolvedValue(makeSanction({ status: 'RESOLVED' })),
    });
    const uc = new ApplyAjcUseCase(sanctionsPort, makeDebtsPort(), makeEmitter());
    await expect(
      uc.execute({
        profileId: 'p-1',
        sanctionId: 'sanc-1',
        refereeSalary: 5000,
        fechasToFree: 2,
        appliedByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.AJC_INVALID_SANCTION });
  });

  it('rechaza si endsAt ya pasó', async () => {
    const sanctionsPort = makeSanctionsPort({
      findById: jest
        .fn()
        .mockResolvedValue(makeSanction({ endsAt: new Date(Date.now() - 1000) })),
    });
    const uc = new ApplyAjcUseCase(sanctionsPort, makeDebtsPort(), makeEmitter());
    await expect(
      uc.execute({
        profileId: 'p-1',
        sanctionId: 'sanc-1',
        refereeSalary: 5000,
        fechasToFree: 2,
        appliedByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.AJC_INVALID_SANCTION });
  });

  it('rechaza fechasToFree <= 0', async () => {
    const uc = new ApplyAjcUseCase(makeSanctionsPort(), makeDebtsPort(), makeEmitter());
    await expect(
      uc.execute({
        profileId: 'p-1',
        sanctionId: 'sanc-1',
        refereeSalary: 5000,
        fechasToFree: 0,
        appliedByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.AJC_INVALID_FECHAS });
  });

  it('rechaza si fechasToFree > sanctionTotalFechas (cuando se conoce)', async () => {
    const uc = new ApplyAjcUseCase(makeSanctionsPort(), makeDebtsPort(), makeEmitter());
    await expect(
      uc.execute({
        profileId: 'p-1',
        sanctionId: 'sanc-1',
        refereeSalary: 5000,
        fechasToFree: 14,
        sanctionTotalFechas: 7,
        appliedByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.AJC_INVALID_FECHAS });
  });

  it('rechaza si la sanción es de otro jugador', async () => {
    const sanctionsPort = makeSanctionsPort({
      findById: jest
        .fn()
        .mockResolvedValue(makeSanction({ targetProfileId: 'OTRO' })),
    });
    const uc = new ApplyAjcUseCase(sanctionsPort, makeDebtsPort(), makeEmitter());
    await expect(
      uc.execute({
        profileId: 'p-1',
        sanctionId: 'sanc-1',
        refereeSalary: 5000,
        fechasToFree: 2,
        appliedByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.AJC_INVALID_SANCTION });
  });
});
