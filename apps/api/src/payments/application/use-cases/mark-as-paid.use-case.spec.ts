import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { DomainEvent } from '../../../common/events';
import { DebtsService } from '../../../debts/application/services/debts.service';
import {
  IPaymentRepository,
  PaymentWithRelations,
} from '../ports/payment-repository.port';
import { IRegistrationContextPort } from '../ports/registration-context.port';
import { MarkAsPaidUseCase } from './mark-as-paid.use-case';

const buildPayment = (
  override: Partial<PaymentWithRelations> = {},
): PaymentWithRelations => ({
  id: 'p-1',
  debtId: 'd-1',
  registrationId: null,
  matchId: null,
  profileId: 'profile-1',
  amount: 5000,
  currency: 'ARS',
  method: 'transferencia',
  status: 'pendiente',
  providerPaymentId: null,
  providerResponse: null,
  processedAt: null,
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
  profile: { id: 'profile-1', name: 'Delegado', email: 'd@ex.com' },
  registration: null,
  match: null,
  debt: {
    id: 'd-1',
    type: 'REGISTRATION_FEE',
    status: 'APPROVED',
    concept: 'Insc. equipo',
    currentBalance: new Prisma.Decimal('5000'),
    originAmount: new Prisma.Decimal('5000'),
    currency: 'ARS',
    teamId: 'team-A',
    profileId: null,
    friendlyId: null,
    registrationId: null,
    matchId: null,
  },
  ...override,
});

const makeRepo = (
  initial: PaymentWithRelations,
): jest.Mocked<IPaymentRepository> => {
  const state: PaymentWithRelations = { ...initial };
  return {
    create: jest.fn(),
    findById: jest.fn().mockImplementation(async () => ({ ...state })),
    findByProviderExternalReference: jest.fn(),
    findActiveForResource: jest.fn(),
    list: jest.fn(),
    update: jest.fn().mockImplementation(async (_id: string, patch) => {
      Object.assign(state, patch);
      return { ...state };
    }),
    getSummary: jest.fn(),
  } as unknown as jest.Mocked<IPaymentRepository>;
};

const makeDebtsService = (): jest.Mocked<DebtsService> =>
  ({
    applyPayment: jest.fn().mockResolvedValue(undefined),
    createInternal: jest.fn(),
    hasOutstandingDebts: jest.fn(),
    findOutstandingDebts: jest.fn(),
  }) as unknown as jest.Mocked<DebtsService>;

const makeRegCtx = (): jest.Mocked<IRegistrationContextPort> =>
  ({
    getById: jest.fn(),
    markPaid: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<IRegistrationContextPort>;

const makeEmitter = (): jest.Mocked<EventEmitter2> =>
  ({
    emit: jest.fn().mockReturnValue(true),
  }) as unknown as jest.Mocked<EventEmitter2>;

describe('MarkAsPaidUseCase', () => {
  it('aprueba un pago en transferencia → llama applyPayment a la deuda y emite PAYMENT_APPROVED', async () => {
    const payment = buildPayment();
    const repo = makeRepo(payment);
    const debts = makeDebtsService();
    const registrationCtx = makeRegCtx();
    const emitter = makeEmitter();

    const useCase = new MarkAsPaidUseCase(repo, debts, registrationCtx, emitter);

    const result = await useCase.execute({
      paymentId: 'p-1',
      adminId: 'admin-1',
      notes: 'Aprobado tras revisión',
    });

    expect(result.status).toBe('procesado');
    expect(debts.applyPayment).toHaveBeenCalledWith({
      debtId: 'd-1',
      amount: expect.any(Prisma.Decimal),
      paidByProfileId: 'admin-1',
    });
    expect(emitter.emit).toHaveBeenCalledWith(
      DomainEvent.PAYMENT_APPROVED,
      expect.objectContaining({
        paymentId: 'p-1',
        debtId: 'd-1',
        approvedBy: 'admin-1',
        method: 'transferencia',
      }),
    );
  });

  it('rechaza marcar manualmente un pago de MercadoPago', async () => {
    const payment = buildPayment({ method: 'mercadopago' });
    const repo = makeRepo(payment);
    const useCase = new MarkAsPaidUseCase(
      repo,
      makeDebtsService(),
      makeRegCtx(),
      makeEmitter(),
    );

    await expect(
      useCase.execute({ paymentId: 'p-1', adminId: 'admin-1' }),
    ).rejects.toMatchObject({ code: ErrorCode.PAYMENT_METHOD_INVALID });
  });

  it('rechaza si el pago ya está procesado', async () => {
    const payment = buildPayment({ status: 'procesado' });
    const repo = makeRepo(payment);
    const useCase = new MarkAsPaidUseCase(
      repo,
      makeDebtsService(),
      makeRegCtx(),
      makeEmitter(),
    );

    await expect(
      useCase.execute({ paymentId: 'p-1', adminId: 'admin-1' }),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });

  it('si no tiene debtId pero sí registrationId, marca registration pagada (legacy)', async () => {
    const payment = buildPayment({
      debtId: null,
      registrationId: 'reg-1',
      debt: null,
    });
    const repo = makeRepo(payment);
    const debts = makeDebtsService();
    const registrationCtx = makeRegCtx();
    const useCase = new MarkAsPaidUseCase(
      repo,
      debts,
      registrationCtx,
      makeEmitter(),
    );

    await useCase.execute({ paymentId: 'p-1', adminId: 'admin-1' });

    expect(debts.applyPayment).not.toHaveBeenCalled();
    expect(registrationCtx.markPaid).toHaveBeenCalledWith('reg-1');
  });

  it('payment no encontrado → NOT_FOUND', async () => {
    const repo = makeRepo(buildPayment());
    repo.findById.mockResolvedValueOnce(null);
    const useCase = new MarkAsPaidUseCase(
      repo,
      makeDebtsService(),
      makeRegCtx(),
      makeEmitter(),
    );

    await expect(
      useCase.execute({ paymentId: 'p-x', adminId: 'admin-1' }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});
