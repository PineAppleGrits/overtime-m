import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import {
  DebtSummaryForPayment,
  IDebtContextPort,
} from '../ports/debt-context.port';
import { IMatchContextPort } from '../ports/match-context.port';
import {
  IPaymentRepository,
  PaymentWithRelations,
} from '../ports/payment-repository.port';
import { IRegistrationContextPort } from '../ports/registration-context.port';
import { CreatePaymentUseCase } from './create-payment.use-case';

const buildDebt = (
  o: Partial<DebtSummaryForPayment> = {},
): DebtSummaryForPayment => ({
  id: 'd-1',
  type: 'REGISTRATION_FEE',
  status: 'APPROVED',
  concept: 'Insc',
  currentBalance: new Prisma.Decimal(5000),
  originAmount: new Prisma.Decimal(5000),
  currency: 'ARS',
  teamId: 'team-A',
  profileId: null,
  registrationId: 'reg-1',
  matchId: null,
  friendlyId: null,
  metadata: null,
  ...o,
});

const makeRepo = (): jest.Mocked<IPaymentRepository> =>
  ({
    create: jest.fn().mockImplementation(async (input) => ({
      id: 'p-1',
      ...input,
      profile: { id: input.profileId, name: 'X', email: null },
      registration: null,
      match: null,
      debt: null,
      providerResponse: null,
      processedAt: null,
      providerPaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as never,
    findById: jest.fn(),
    findByProviderExternalReference: jest.fn(),
    findActiveForResource: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    getSummary: jest.fn(),
  }) as unknown as jest.Mocked<IPaymentRepository>;

const makeDebtCtx = (
  debt: DebtSummaryForPayment | null,
): jest.Mocked<IDebtContextPort> =>
  ({
    getById: jest.fn().mockResolvedValue(debt),
    listByRegistrationId: jest.fn(),
    hasReusableInsurance: jest.fn(),
  }) as unknown as jest.Mocked<IDebtContextPort>;

const makeRegCtx = (): jest.Mocked<IRegistrationContextPort> =>
  ({
    getById: jest.fn(),
    markPaid: jest.fn(),
  }) as unknown as jest.Mocked<IRegistrationContextPort>;
const makeMatchCtx = (): jest.Mocked<IMatchContextPort> =>
  ({ getById: jest.fn() }) as unknown as jest.Mocked<IMatchContextPort>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('CreatePaymentUseCase — debtId path', () => {
  it('default amount = currentBalance cuando no se pasa', async () => {
    const repo = makeRepo();
    const debtCtx = makeDebtCtx(buildDebt());
    const emitter = makeEmitter();
    const uc = new CreatePaymentUseCase(
      repo,
      debtCtx,
      makeRegCtx(),
      makeMatchCtx(),
      emitter,
    );

    await uc.execute({
      profileId: 'profile-1',
      debtId: 'd-1',
      method: 'transferencia',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000, debtId: 'd-1', method: 'transferencia' }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.PAYMENT_CREATED,
      expect.objectContaining({ paymentId: 'p-1', debtId: 'd-1' }),
    );
  });

  it('rechaza si amount > currentBalance', async () => {
    const debtCtx = makeDebtCtx(buildDebt());
    const uc = new CreatePaymentUseCase(
      makeRepo(),
      debtCtx,
      makeRegCtx(),
      makeMatchCtx(),
      makeEmitter(),
    );
    await expect(
      uc.execute({
        profileId: 'profile-1',
        debtId: 'd-1',
        amount: 6000,
        method: 'cash',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_AMOUNT_EXCEEDS_BALANCE });
  });

  it('rechaza método inválido', async () => {
    const uc = new CreatePaymentUseCase(
      makeRepo(),
      makeDebtCtx(buildDebt()),
      makeRegCtx(),
      makeMatchCtx(),
      makeEmitter(),
    );
    await expect(
      uc.execute({
        profileId: 'profile-1',
        debtId: 'd-1',
        method: 'crypto' as never,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.PAYMENT_METHOD_INVALID });
  });

  it('rechaza deuda PAID', async () => {
    const uc = new CreatePaymentUseCase(
      makeRepo(),
      makeDebtCtx(buildDebt({ status: 'PAID' })),
      makeRegCtx(),
      makeMatchCtx(),
      makeEmitter(),
    );
    await expect(
      uc.execute({ profileId: 'p', debtId: 'd-1', method: 'cash' }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_ALREADY_PAID });
  });

  it('rechaza si no se pasa ningún resource', async () => {
    const uc = new CreatePaymentUseCase(
      makeRepo(),
      makeDebtCtx(null),
      makeRegCtx(),
      makeMatchCtx(),
      makeEmitter(),
    );
    await expect(
      uc.execute({ profileId: 'p', method: 'cash' }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });
});

describe('CreatePaymentUseCase — debt FRIENDLY_DEPOSIT (RN-022)', () => {
  it('crea payment para deuda friendly_deposit y emite PAYMENT_CREATED', async () => {
    const debt = buildDebt({
      id: 'd-fd',
      type: 'FRIENDLY_DEPOSIT',
      friendlyId: 'fr-1',
      registrationId: null,
      currentBalance: new Prisma.Decimal(2000),
      originAmount: new Prisma.Decimal(2000),
    });
    const repo = makeRepo();
    const emitter = makeEmitter();
    const uc = new CreatePaymentUseCase(
      repo,
      makeDebtCtx(debt),
      makeRegCtx(),
      makeMatchCtx(),
      emitter,
    );

    await uc.execute({
      profileId: 'profile-1',
      debtId: 'd-fd',
      method: 'mercadopago',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        debtId: 'd-fd',
        amount: 2000,
        method: 'mercadopago',
      }),
    );
  });
});
