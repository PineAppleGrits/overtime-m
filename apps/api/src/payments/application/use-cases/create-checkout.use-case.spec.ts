import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import {
  DebtSummaryForPayment,
  IDebtContextPort,
} from '../ports/debt-context.port';
import { IMatchContextPort } from '../ports/match-context.port';
import { IMercadoPagoPort } from '../ports/mercadopago.port';
import {
  IPaymentRepository,
  PaymentWithRelations,
} from '../ports/payment-repository.port';
import { IProfileContextPort } from '../ports/profile-context.port';
import { IRegistrationContextPort } from '../ports/registration-context.port';
import { CreateCheckoutUseCase } from './create-checkout.use-case';

const makeRepo = (): jest.Mocked<IPaymentRepository> => {
  let id = 0;
  return {
    create: jest.fn().mockImplementation(async (input) => ({
      id: `p-${++id}`,
      ...input,
      providerResponse: null,
      processedAt: null,
      providerPaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: { id: input.profileId, name: 'X', email: 'x@x.com' },
      registration: null,
      match: null,
      debt: null,
    })) as unknown as IPaymentRepository['create'],
    findById: jest.fn(),
    findByProviderExternalReference: jest.fn(),
    findActiveForResource: jest.fn().mockResolvedValue(null),
    list: jest.fn(),
    update: jest.fn().mockImplementation(async (id, patch) => ({
      id,
      ...patch,
    })) as unknown as IPaymentRepository['update'],
    getSummary: jest.fn(),
  } as unknown as jest.Mocked<IPaymentRepository>;
};

const makeMp = (
  overrides: Partial<IMercadoPagoPort> = {},
): jest.Mocked<IMercadoPagoPort> =>
  ({
    isEnabled: jest.fn().mockReturnValue(true),
    createPreference: jest.fn().mockResolvedValue({
      success: true,
      preferenceId: 'pref-1',
      initPoint: 'https://mp/init',
      sandboxInitPoint: 'https://mp/sb',
    }),
    getPaymentInfo: jest.fn(),
    processWebhook: jest.fn(),
    validateWebhookSignature: jest.fn(),
    mapPaymentStatus: jest.fn(),
    getStatusDescription: jest.fn(),
    ...overrides,
  }) as unknown as jest.Mocked<IMercadoPagoPort>;

const makeProfileCtx = (): jest.Mocked<IProfileContextPort> =>
  ({
    getById: jest.fn().mockResolvedValue({
      id: 'profile-1',
      name: 'Delegado',
      email: 'd@ex.com',
    }),
  }) as unknown as jest.Mocked<IProfileContextPort>;

const makeDebtCtx = (
  debt: DebtSummaryForPayment | null,
): jest.Mocked<IDebtContextPort> =>
  ({
    getById: jest.fn().mockResolvedValue(debt),
    listByRegistrationId: jest.fn(),
    hasReusableInsurance: jest.fn(),
  }) as unknown as jest.Mocked<IDebtContextPort>;

const makeRegCtx = (): jest.Mocked<IRegistrationContextPort> =>
  ({ getById: jest.fn(), markPaid: jest.fn() }) as unknown as jest.Mocked<IRegistrationContextPort>;
const makeMatchCtx = (): jest.Mocked<IMatchContextPort> =>
  ({ getById: jest.fn() }) as unknown as jest.Mocked<IMatchContextPort>;
const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({ emit: jest.fn().mockReturnValue(true) }) as unknown as jest.Mocked<EventEmitter2>;

describe('CreateCheckoutUseCase — debt resource (RN-022 friendly deposit)', () => {
  it('crea checkout MP para FRIENDLY_DEPOSIT con monto = currentBalance', async () => {
    const debt: DebtSummaryForPayment = {
      id: 'd-fd',
      type: 'FRIENDLY_DEPOSIT',
      status: 'APPROVED',
      concept: 'Seña amistoso',
      currentBalance: new Prisma.Decimal(2000),
      originAmount: new Prisma.Decimal(2000),
      currency: 'ARS',
      teamId: 'team-A',
      profileId: null,
      registrationId: null,
      matchId: null,
      friendlyId: 'fr-1',
      metadata: null,
    };
    const repo = makeRepo();
    const mp = makeMp();
    const emitter = makeEmitter();

    const uc = new CreateCheckoutUseCase(
      repo,
      mp,
      makeDebtCtx(debt),
      makeRegCtx(),
      makeMatchCtx(),
      makeProfileCtx(),
      emitter,
    );

    const result = await uc.execute({
      profileId: 'profile-1',
      resource: { kind: 'debt', debtId: 'd-fd' },
    });

    expect(result.amount).toBe(2000);
    expect(result.checkoutUrl).toBe('https://mp/init');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        debtId: 'd-fd',
        amount: 2000,
        method: 'mercadopago',
        status: 'pendiente',
      }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.PAYMENT_CREATED,
      expect.objectContaining({ debtId: 'd-fd' }),
    );
    expect(mp.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Seña amistoso'),
        externalReference: expect.any(String),
        metadata: expect.objectContaining({
          debtId: 'd-fd',
          friendlyId: 'fr-1',
        }),
      }),
    );
  });

  it('rechaza si MP está deshabilitado', async () => {
    const uc = new CreateCheckoutUseCase(
      makeRepo(),
      makeMp({ isEnabled: jest.fn().mockReturnValue(false) }),
      makeDebtCtx(null),
      makeRegCtx(),
      makeMatchCtx(),
      makeProfileCtx(),
      makeEmitter(),
    );
    await expect(
      uc.execute({
        profileId: 'profile-1',
        resource: { kind: 'debt', debtId: 'd-1' },
      }),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });

  it('rechaza si la debt está PAID', async () => {
    const debt: DebtSummaryForPayment = {
      id: 'd',
      type: 'FRIENDLY_DEPOSIT',
      status: 'PAID',
      concept: 'X',
      currentBalance: new Prisma.Decimal(0),
      originAmount: new Prisma.Decimal(2000),
      currency: 'ARS',
      teamId: null,
      profileId: null,
      registrationId: null,
      matchId: null,
      friendlyId: null,
      metadata: null,
    };
    const uc = new CreateCheckoutUseCase(
      makeRepo(),
      makeMp(),
      makeDebtCtx(debt),
      makeRegCtx(),
      makeMatchCtx(),
      makeProfileCtx(),
      makeEmitter(),
    );
    await expect(
      uc.execute({
        profileId: 'profile-1',
        resource: { kind: 'debt', debtId: 'd' },
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEBT_ALREADY_PAID });
  });
});
