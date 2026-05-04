import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  PaymentMethodValue,
  isValidPaymentMethod,
  normalizeMethod,
} from '../../domain/rules/method-validation.rules';
import {
  DEBT_CONTEXT_PORT,
  IDebtContextPort,
} from '../ports/debt-context.port';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
  PaymentWithRelations,
} from '../ports/payment-repository.port';
import {
  IRegistrationContextPort,
  REGISTRATION_CONTEXT_PORT,
} from '../ports/registration-context.port';
import {
  IMatchContextPort,
  MATCH_CONTEXT_PORT,
} from '../ports/match-context.port';

export interface CreatePaymentInput {
  /** Profile que registra el pago (delegado / admin / user). */
  profileId: string;
  /** Origen primario (preferido) — RN-013 a RN-017 nuevos pagos pasan por aquí. */
  debtId?: string;
  /** Legacy nullable — para back-compat de pagos sin debt. */
  registrationId?: string;
  matchId?: string;
  /**
   * Override opcional. Si no viene, default = `Debt.currentBalance` cuando
   * `debtId` está presente. Para back-compat se requiere si no hay debtId.
   */
  amount?: number;
  currency?: string;
  method: string;
}

/**
 * RN-013 / RN-014 / RN-022 — crea un Payment manual (efectivo, transferencia,
 * MP no-checkout). Si pasa `debtId`, valida saldo y default amount al
 * `currentBalance` de la deuda. NO marca el payment como aprobado — eso lo hace
 * `MarkAsPaidUseCase` o el webhook.
 *
 * Eventos: emite `PAYMENT_CREATED`.
 */
@Injectable()
export class CreatePaymentUseCase {
  private readonly logger = new Logger(CreatePaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    @Inject(DEBT_CONTEXT_PORT)
    private readonly debtCtx: IDebtContextPort,
    @Inject(REGISTRATION_CONTEXT_PORT)
    private readonly registrationCtx: IRegistrationContextPort,
    @Inject(MATCH_CONTEXT_PORT)
    private readonly matchCtx: IMatchContextPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreatePaymentInput): Promise<PaymentWithRelations> {
    if (!isValidPaymentMethod(input.method)) {
      throw new BusinessError(
        ErrorCode.PAYMENT_METHOD_INVALID,
        `Método de pago inválido: ${input.method}`,
        HttpStatus.BAD_REQUEST,
        { method: input.method },
      );
    }

    const method: PaymentMethodValue = normalizeMethod(
      input.method as PaymentMethodValue,
    );

    if (!input.debtId && !input.registrationId && !input.matchId) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Debe proveerse debtId, registrationId o matchId',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.registrationId && input.matchId) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'No se puede asociar un pago a registration y match a la vez',
        HttpStatus.BAD_REQUEST,
      );
    }

    let resolvedAmount = input.amount;
    let resolvedCurrency = input.currency ?? 'ARS';

    // ── Path PRIMARIO: debtId
    if (input.debtId) {
      const debt = await this.debtCtx.getById(input.debtId);
      if (!debt) {
        throw new BusinessError(
          ErrorCode.NOT_FOUND,
          `Deuda ${input.debtId} no encontrada`,
          HttpStatus.NOT_FOUND,
          { debtId: input.debtId },
        );
      }
      if (debt.status === 'PAID') {
        throw new BusinessError(
          ErrorCode.DEBT_ALREADY_PAID,
          'La deuda ya está totalmente pagada',
          HttpStatus.CONFLICT,
          { debtId: debt.id },
        );
      }
      if (debt.status !== 'APPROVED' && debt.status !== 'PARTIALLY_PAID') {
        throw new BusinessError(
          ErrorCode.DEBT_INVALID_STATUS_TRANSITION,
          `No se puede pagar una deuda en estado ${debt.status}`,
          HttpStatus.CONFLICT,
          { debtId: debt.id, status: debt.status },
        );
      }

      // Default amount = currentBalance.
      if (resolvedAmount == null) {
        resolvedAmount = Number(debt.currentBalance.toString());
      }

      const dec = new Prisma.Decimal(resolvedAmount);
      if (dec.lessThanOrEqualTo(0)) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'El monto debe ser mayor a 0',
          HttpStatus.BAD_REQUEST,
          { amount: resolvedAmount },
        );
      }
      if (dec.greaterThan(debt.currentBalance)) {
        throw new BusinessError(
          ErrorCode.DEBT_AMOUNT_EXCEEDS_BALANCE,
          'El monto del pago supera el saldo pendiente de la deuda',
          HttpStatus.CONFLICT,
          {
            debtId: debt.id,
            currentBalance: debt.currentBalance.toString(),
            attemptedAmount: dec.toString(),
          },
        );
      }

      resolvedCurrency = debt.currency || resolvedCurrency;
    } else {
      // ── Path LEGACY: sin debtId. Validar registration/match y exigir amount.
      if (input.registrationId) {
        const reg = await this.registrationCtx.getById(input.registrationId);
        if (!reg) {
          throw new BusinessError(
            ErrorCode.NOT_FOUND,
            'Inscripción no encontrada',
            HttpStatus.NOT_FOUND,
            { registrationId: input.registrationId },
          );
        }
      }
      if (input.matchId) {
        const m = await this.matchCtx.getById(input.matchId);
        if (!m) {
          throw new BusinessError(
            ErrorCode.NOT_FOUND,
            'Partido no encontrado',
            HttpStatus.NOT_FOUND,
            { matchId: input.matchId },
          );
        }
      }
      if (resolvedAmount == null || resolvedAmount <= 0) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'amount es requerido y debe ser mayor a 0 cuando no se pasa debtId',
          HttpStatus.BAD_REQUEST,
          { amount: resolvedAmount },
        );
      }
    }

    const payment = await this.repo.create({
      debtId: input.debtId ?? null,
      registrationId: input.registrationId ?? null,
      matchId: input.matchId ?? null,
      profileId: input.profileId,
      amount: resolvedAmount!,
      currency: resolvedCurrency,
      method,
      status: 'pendiente',
    });

    const payload: DomainEventPayloads['payment.created'] = {
      paymentId: payment.id,
      debtId: payment.debtId ?? undefined,
    };
    this.eventEmitter.emit(DomainEvent.PAYMENT_CREATED, payload);

    this.logger.log(
      `Payment creado: ${payment.id} (method=${method}, amount=${resolvedAmount}, debtId=${payment.debtId ?? '-'})`,
    );

    return payment;
  }
}
