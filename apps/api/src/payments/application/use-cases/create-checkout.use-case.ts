import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  DEBT_CONTEXT_PORT,
  IDebtContextPort,
} from '../ports/debt-context.port';
import {
  IMercadoPagoPort,
  MERCADOPAGO_PORT,
} from '../ports/mercadopago.port';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../ports/payment-repository.port';
import {
  IRegistrationContextPort,
  REGISTRATION_CONTEXT_PORT,
} from '../ports/registration-context.port';
import {
  IMatchContextPort,
  MATCH_CONTEXT_PORT,
} from '../ports/match-context.port';
import {
  IProfileContextPort,
  PROFILE_CONTEXT_PORT,
} from '../ports/profile-context.port';

export type CheckoutResource =
  | { kind: 'debt'; debtId: string }
  | { kind: 'registration'; registrationId: string }
  | { kind: 'match'; matchId: string };

export interface CreateCheckoutInput {
  resource: CheckoutResource;
  profileId: string;
}

export interface CreateCheckoutResult {
  paymentId: string;
  checkoutUrl: string;
  sandboxUrl?: string;
  preferenceId: string;
  amount: number;
  currency: string;
  expiresAt: string;
}

/**
 * Crea un Payment status=pendiente y obtiene la preference de MP.
 *
 * Path PRIMARIO (RN-013/-022): `kind=debt` — el FE envía `debtId` y el
 * monto se toma de `Debt.currentBalance`. El Payment apunta a la `Debt`.
 *
 * Paths LEGACY: `kind=registration` y `kind=match` mantienen compatibilidad
 * con el FE actual. NO actualizan Debt.
 */
@Injectable()
export class CreateCheckoutUseCase {
  private readonly logger = new Logger(CreateCheckoutUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    @Inject(MERCADOPAGO_PORT)
    private readonly mp: IMercadoPagoPort,
    @Inject(DEBT_CONTEXT_PORT)
    private readonly debtCtx: IDebtContextPort,
    @Inject(REGISTRATION_CONTEXT_PORT)
    private readonly registrationCtx: IRegistrationContextPort,
    @Inject(MATCH_CONTEXT_PORT)
    private readonly matchCtx: IMatchContextPort,
    @Inject(PROFILE_CONTEXT_PORT)
    private readonly profileCtx: IProfileContextPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    if (!this.mp.isEnabled()) {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        'MercadoPago no está habilitado',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const profile = await this.profileCtx.getById(input.profileId);
    if (!profile) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Profile no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    let amount: number;
    let currency = 'ARS';
    let title: string;
    let description: string;
    let debtId: string | null = null;
    let registrationId: string | null = null;
    let matchId: string | null = null;
    let metadata: Record<string, unknown> = { profileId: input.profileId };

    switch (input.resource.kind) {
      case 'debt': {
        const debt = await this.debtCtx.getById(input.resource.debtId);
        if (!debt) {
          throw new BusinessError(
            ErrorCode.NOT_FOUND,
            'Deuda no encontrada',
            HttpStatus.NOT_FOUND,
            { debtId: input.resource.debtId },
          );
        }
        if (debt.status === 'PAID') {
          throw new BusinessError(
            ErrorCode.DEBT_ALREADY_PAID,
            'La deuda ya está saldada',
            HttpStatus.CONFLICT,
            { debtId: debt.id },
          );
        }
        if (debt.status !== 'APPROVED' && debt.status !== 'PARTIALLY_PAID') {
          throw new BusinessError(
            ErrorCode.DEBT_INVALID_STATUS_TRANSITION,
            `No se puede crear checkout para una deuda en estado ${debt.status}`,
            HttpStatus.CONFLICT,
            { debtId: debt.id, status: debt.status },
          );
        }
        amount = Number(debt.currentBalance.toString());
        currency = debt.currency || 'ARS';
        title = `Pago: ${debt.concept}`;
        description = `Deuda tipo ${debt.type}`;
        debtId = debt.id;
        // arrastramos relaciones legacy si la debt nace de una de ellas, así
        // los reportes y el FE (que aún muestra registration/match) siguen vivos.
        registrationId = debt.registrationId;
        matchId = debt.matchId;
        metadata = {
          ...metadata,
          debtId: debt.id,
          debtType: debt.type,
          friendlyId: debt.friendlyId,
        };
        break;
      }
      case 'registration': {
        const reg = await this.registrationCtx.getById(
          input.resource.registrationId,
        );
        if (!reg) {
          throw new BusinessError(
            ErrorCode.NOT_FOUND,
            'Inscripción no encontrada',
            HttpStatus.NOT_FOUND,
            { registrationId: input.resource.registrationId },
          );
        }
        if (reg.status === 'pagada') {
          throw new BusinessError(
            ErrorCode.CONFLICT,
            'La inscripción ya está pagada',
            HttpStatus.CONFLICT,
            { registrationId: reg.id },
          );
        }
        // Legacy: amount fijo (5000 default). Nuevos flujos deben pasar `kind=debt`.
        // TODO: cuando RN-015/RN-016 quede totalmente migrado, sustituir por
        //       PricingService.computeRegistrationFee + crear debt + checkout.
        amount = 5000;
        title = `Inscripción: ${reg.team.name}`;
        description = `Inscripción al torneo ${reg.tournament.name} - Categoría ${reg.category.name}`;
        registrationId = reg.id;
        metadata = { ...metadata, registrationId: reg.id, type: 'registration' };
        break;
      }
      case 'match': {
        const m = await this.matchCtx.getById(input.resource.matchId);
        if (!m) {
          throw new BusinessError(
            ErrorCode.NOT_FOUND,
            'Partido no encontrado',
            HttpStatus.NOT_FOUND,
            { matchId: input.resource.matchId },
          );
        }
        amount = m.costPerTeam ?? 0;
        if (amount <= 0) {
          throw new BusinessError(
            ErrorCode.VALIDATION_FAILED,
            'El partido no tiene costo configurado',
            HttpStatus.BAD_REQUEST,
            { matchId: m.id },
          );
        }
        title = `Partido: ${m.homeTeam?.name ?? 'TBD'} vs ${m.awayTeam?.name ?? 'TBD'}`;
        description = `Pago de partido`;
        matchId = m.id;
        metadata = { ...metadata, matchId: m.id, type: 'match' };
        break;
      }
    }

    if (new Prisma.Decimal(amount).lessThanOrEqualTo(0)) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'El monto del checkout debe ser mayor a 0',
        HttpStatus.BAD_REQUEST,
        { amount },
      );
    }

    // Reusar payment pendiente reciente para el mismo recurso (idempotencia
    // simple). Si el FE refresca, evitamos crear preferences duplicadas.
    const existing = await this.repo.findActiveForResource({
      debtId: debtId ?? undefined,
      registrationId: registrationId ?? undefined,
      matchId: matchId ?? undefined,
    });
    if (existing && existing.providerPaymentId) {
      const ageHours =
        (Date.now() - new Date(existing.createdAt).getTime()) / 3600_000;
      if (ageHours < 23) {
        this.logger.log(
          `Reutilizando payment pendiente ${existing.id} (preference=${existing.providerPaymentId})`,
        );
        // Falta el initPoint del provider; intentamos recrearlo abajo igual,
        // pero conservamos el paymentId para no duplicar la fila.
      }
    }

    const payment =
      existing ??
      (await this.repo.create({
        debtId,
        registrationId,
        matchId,
        profileId: input.profileId,
        amount,
        currency,
        method: 'mercadopago',
        status: 'pendiente',
      }));

    const preference = await this.mp.createPreference({
      paymentId: payment.id,
      title,
      description,
      amount,
      currency,
      payerEmail: profile.email ?? '',
      payerName: profile.name,
      externalReference: payment.id,
      metadata,
    });

    if (!preference.success) {
      await this.repo.update(payment.id, { status: 'fallido' });
      throw new BusinessError(
        ErrorCode.CONFLICT,
        `Error creando preferencia de MercadoPago: ${preference.error ?? 'desconocido'}`,
        HttpStatus.BAD_GATEWAY,
        { paymentId: payment.id },
      );
    }

    await this.repo.update(payment.id, {
      providerPaymentId: preference.preferenceId ?? null,
    });

    if (!existing) {
      const payload: DomainEventPayloads['payment.created'] = {
        paymentId: payment.id,
        debtId: payment.debtId ?? undefined,
      };
      this.eventEmitter.emit(DomainEvent.PAYMENT_CREATED, payload);
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.logger.log(
      `Checkout MP creado: payment=${payment.id} preference=${preference.preferenceId}`,
    );

    return {
      paymentId: payment.id,
      checkoutUrl: preference.initPoint!,
      sandboxUrl: preference.sandboxInitPoint,
      preferenceId: preference.preferenceId!,
      amount,
      currency,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
