import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import { DebtsService } from '../../../debts/application/services/debts.service';
import { PricingService } from '../../../pricing/application/services/pricing.service';
import {
  DebtSummaryForPayment,
  IDebtContextPort,
} from '../ports/debt-context.port';
import {
  IRegistrationContextPort,
  RegistrationSummary,
} from '../ports/registration-context.port';
import { RegistrationPaymentsService } from './registration-payments.service';

const baseRegistration: RegistrationSummary = {
  id: 'reg-1',
  status: 'pending',
  teamId: 'team-A',
  tournamentId: 'tour-1',
  categoryId: 'cat-1',
  team: { id: 'team-A', name: 'Equipo A' },
  tournament: {
    id: 'tour-1',
    name: 'Torneo X',
    sportId: 'sport-bb',
    insurancePerPlayer: 1000,
  },
  category: { id: 'cat-1', name: 'Cat A' },
  rosterProfileIds: ['p1', 'p2', 'p3'],
};

const makeDebtCtx = (): jest.Mocked<IDebtContextPort> =>
  ({
    getById: jest.fn(),
    listByRegistrationId: jest.fn().mockResolvedValue([]),
    hasReusableInsurance: jest.fn().mockResolvedValue(false),
  }) as unknown as jest.Mocked<IDebtContextPort>;

const makeRegistrationCtx = (
  reg: RegistrationSummary | null = baseRegistration,
): jest.Mocked<IRegistrationContextPort> =>
  ({
    getById: jest.fn().mockResolvedValue(reg),
    markPaid: jest.fn(),
  }) as unknown as jest.Mocked<IRegistrationContextPort>;

const makeDebtsService = (): jest.Mocked<DebtsService> => {
  let counter = 1;
  return {
    createInternal: jest.fn().mockImplementation(async (input) => ({
      id: `debt-${counter++}`,
      ...input,
      status: 'APPROVED',
    })),
    applyPayment: jest.fn(),
    hasOutstandingDebts: jest.fn(),
    findOutstandingDebts: jest.fn(),
  } as unknown as jest.Mocked<DebtsService>;
};

const makePricingService = (
  amount = 5000,
): jest.Mocked<PricingService> =>
  ({
    computeRegistrationFee: jest.fn().mockResolvedValue({
      amount: new Prisma.Decimal(amount),
      currency: 'ARS',
      paymentMethod: null,
      period: { id: 'pp-1' },
    }),
    getCurrentPricing: jest.fn(),
  }) as unknown as jest.Mocked<PricingService>;

describe('RegistrationPaymentsService.createRegistrationDebts', () => {
  it('crea entry fee + 1 INSURANCE por jugador del roster', async () => {
    const debts = makeDebtsService();
    const pricing = makePricingService(5000);
    const regCtx = makeRegistrationCtx();
    const debtCtx = makeDebtCtx();
    const svc = new RegistrationPaymentsService(
      debts,
      pricing,
      regCtx,
      debtCtx,
    );

    const result = await svc.createRegistrationDebts({
      registrationId: 'reg-1',
      createdByProfileId: 'admin-1',
    });

    expect(result.entryFeeDebtId).toBe('debt-1');
    expect(result.insuranceDebtIds.length).toBe(3);
    expect(result.insuranceReusedFor).toHaveLength(0);
    expect(debts.createInternal).toHaveBeenCalledTimes(4); // 1 entry + 3 insurances
    expect(pricing.computeRegistrationFee).toHaveBeenCalledWith(
      expect.objectContaining({ tournamentId: 'tour-1' }),
    );
  });

  it('RN-017 — reusa el seguro si el jugador ya tiene INSURANCE PAID del año', async () => {
    const debts = makeDebtsService();
    const pricing = makePricingService();
    const regCtx = makeRegistrationCtx();
    const debtCtx = makeDebtCtx();
    debtCtx.hasReusableInsurance.mockImplementation(async ({ profileId }) =>
      profileId === 'p2',
    );
    const svc = new RegistrationPaymentsService(
      debts,
      pricing,
      regCtx,
      debtCtx,
    );

    const result = await svc.createRegistrationDebts({
      registrationId: 'reg-1',
      createdByProfileId: 'admin-1',
    });

    expect(result.insuranceReusedFor).toEqual(['p2']);
    expect(result.insuranceDebtIds.length).toBe(2);
  });

  it('si insurancePerPlayer = 0/null no crea debts INSURANCE', async () => {
    const debts = makeDebtsService();
    const pricing = makePricingService();
    const regCtx = makeRegistrationCtx({
      ...baseRegistration,
      tournament: { ...baseRegistration.tournament, insurancePerPlayer: null },
    });
    const debtCtx = makeDebtCtx();
    const svc = new RegistrationPaymentsService(
      debts,
      pricing,
      regCtx,
      debtCtx,
    );

    const result = await svc.createRegistrationDebts({
      registrationId: 'reg-1',
      createdByProfileId: 'admin-1',
    });

    expect(result.insuranceDebtIds).toHaveLength(0);
    expect(debts.createInternal).toHaveBeenCalledTimes(1); // solo entry
  });

  it('idempotente — reusa entry fee debt existente sin recrear', async () => {
    const debts = makeDebtsService();
    const pricing = makePricingService();
    const regCtx = makeRegistrationCtx();
    const debtCtx = makeDebtCtx();
    const existing: DebtSummaryForPayment = {
      id: 'existing-entry',
      type: 'REGISTRATION_FEE',
      status: 'APPROVED',
      concept: 'Existing',
      currentBalance: new Prisma.Decimal(5000),
      originAmount: new Prisma.Decimal(5000),
      currency: 'ARS',
      teamId: 'team-A',
      profileId: null,
      registrationId: 'reg-1',
      matchId: null,
      friendlyId: null,
      metadata: null,
    };
    debtCtx.listByRegistrationId.mockResolvedValueOnce([existing]);
    const svc = new RegistrationPaymentsService(
      debts,
      pricing,
      regCtx,
      debtCtx,
    );

    const result = await svc.createRegistrationDebts({
      registrationId: 'reg-1',
      createdByProfileId: 'admin-1',
    });

    expect(result.entryFeeDebtId).toBe('existing-entry');
    // No se llamó pricing.computeRegistrationFee (reuso).
    expect(pricing.computeRegistrationFee).not.toHaveBeenCalled();
  });

  it('NOT_FOUND si la registration no existe', async () => {
    const svc = new RegistrationPaymentsService(
      makeDebtsService(),
      makePricingService(),
      makeRegistrationCtx(null),
      makeDebtCtx(),
    );
    await expect(
      svc.createRegistrationDebts({
        registrationId: 'reg-x',
        createdByProfileId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});

describe('RegistrationPaymentsService.getRegistrationPaymentStatus', () => {
  const buildDebt = (
    over: Partial<DebtSummaryForPayment>,
  ): DebtSummaryForPayment => ({
    id: 'd',
    type: 'REGISTRATION_FEE',
    status: 'APPROVED',
    concept: 'X',
    currentBalance: new Prisma.Decimal(5000),
    originAmount: new Prisma.Decimal(5000),
    currency: 'ARS',
    teamId: 'team-A',
    profileId: null,
    registrationId: 'reg-1',
    matchId: null,
    friendlyId: null,
    metadata: null,
    ...over,
  });

  const make = (debts: DebtSummaryForPayment[]) => {
    const debtCtx = makeDebtCtx();
    debtCtx.listByRegistrationId.mockResolvedValueOnce(debts);
    return new RegistrationPaymentsService(
      makeDebtsService(),
      makePricingService(),
      makeRegistrationCtx(),
      debtCtx,
    );
  };

  it('PENDING_BOTH cuando ambas no se pagaron', async () => {
    const svc = make([
      buildDebt({ id: 'e', type: 'REGISTRATION_FEE', status: 'APPROVED' }),
      buildDebt({ id: 'i1', type: 'INSURANCE', status: 'APPROVED', profileId: 'p1' }),
      buildDebt({ id: 'i2', type: 'INSURANCE', status: 'APPROVED', profileId: 'p2' }),
      buildDebt({ id: 'i3', type: 'INSURANCE', status: 'APPROVED', profileId: 'p3' }),
    ]);
    const r = await svc.getRegistrationPaymentStatus('reg-1');
    expect(r.status).toBe('PENDING_BOTH');
  });

  it('PLAZA_ASEGURADA cuando entry pagada pero insurances faltan', async () => {
    const svc = make([
      buildDebt({ id: 'e', type: 'REGISTRATION_FEE', status: 'PAID' }),
      buildDebt({ id: 'i1', type: 'INSURANCE', status: 'APPROVED', profileId: 'p1' }),
      buildDebt({ id: 'i2', type: 'INSURANCE', status: 'PAID', profileId: 'p2' }),
      buildDebt({ id: 'i3', type: 'INSURANCE', status: 'APPROVED', profileId: 'p3' }),
    ]);
    const r = await svc.getRegistrationPaymentStatus('reg-1');
    expect(r.status).toBe('PLAZA_ASEGURADA');
    expect(r.entryFeePaid).toBe(true);
    expect(r.insurancesPaid).toBe(false);
  });

  it('OFICIAL cuando todo pagado', async () => {
    const svc = make([
      buildDebt({ id: 'e', type: 'REGISTRATION_FEE', status: 'PAID' }),
      buildDebt({ id: 'i1', type: 'INSURANCE', status: 'PAID', profileId: 'p1' }),
      buildDebt({ id: 'i2', type: 'INSURANCE', status: 'PAID', profileId: 'p2' }),
      buildDebt({ id: 'i3', type: 'INSURANCE', status: 'PAID', profileId: 'p3' }),
    ]);
    const r = await svc.getRegistrationPaymentStatus('reg-1');
    expect(r.status).toBe('OFICIAL');
  });

  it('RN-017: jugador sin debt INSURANCE → reused=true y cuenta como pago', async () => {
    const svc = make([
      buildDebt({ id: 'e', type: 'REGISTRATION_FEE', status: 'PAID' }),
      buildDebt({ id: 'i1', type: 'INSURANCE', status: 'PAID', profileId: 'p1' }),
      // p2 sin debt → reused=true
      buildDebt({ id: 'i3', type: 'INSURANCE', status: 'PAID', profileId: 'p3' }),
    ]);
    const r = await svc.getRegistrationPaymentStatus('reg-1');
    expect(r.insurances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ profileId: 'p2', reused: true, paid: true }),
      ]),
    );
    expect(r.status).toBe('OFICIAL');
  });
});
