import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  DEBT_REPOSITORY,
  DebtWithRelations,
  IDebtRepository,
} from '../ports/debt-repository.port';
import { Debt } from '../../domain/entities/debt.entity';

export interface ApplyPaymentToDebtInput {
  debtId: string;
  /** Monto del pago en ARS — string/number/Decimal aceptados. */
  amount: number | string | Prisma.Decimal;
  /** Profile que registra el pago (admin que aprobó el comprobante, MP user, etc.). */
  paidByProfileId: string;
}

/**
 * Aplica un pago al saldo de una Debt.
 *
 * NO crea el `Payment` — eso lo hace W2.2 (PaymentsService). Este use-case
 * actualiza el balance de la Debt + crea audit log + emite evento del nuevo
 * estado (PARTIALLY_PAID o PAID).
 *
 * Validaciones:
 * - amount > 0 → BusinessError VALIDATION_FAILED.
 * - debt.status no debe ser PAID → DEBT_ALREADY_PAID.
 * - amount <= currentBalance → DEBT_AMOUNT_EXCEEDS_BALANCE.
 * - debt.status debe ser activa (APPROVED|PARTIALLY_PAID).
 *
 * Eventos:
 * - PARTIALLY_PAID → `debt.partially.paid`.
 * - PAID → `debt.fully.paid`.
 */
@Injectable()
export class ApplyPaymentToDebtUseCase {
  private readonly logger = new Logger(ApplyPaymentToDebtUseCase.name);

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: ApplyPaymentToDebtInput,
  ): Promise<DebtWithRelations> {
    const amount = toDecimal(input.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'El monto del pago debe ser mayor a 0',
        HttpStatus.BAD_REQUEST,
        { amount: amount.toString() },
      );
    }

    const debt = await this.repo.findById(input.debtId);
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
        `No se puede aplicar pago sobre una deuda en estado ${debt.status}`,
        HttpStatus.CONFLICT,
        { debtId: debt.id, status: debt.status },
      );
    }

    if (amount.greaterThan(debt.currentBalance)) {
      throw new BusinessError(
        ErrorCode.DEBT_AMOUNT_EXCEEDS_BALANCE,
        'El monto del pago supera el saldo pendiente',
        HttpStatus.CONFLICT,
        {
          debtId: debt.id,
          currentBalance: debt.currentBalance.toString(),
          attemptedAmount: amount.toString(),
        },
      );
    }

    // Calcular el resultado en el dominio (puro) y persistir vía repo.
    const domain = Debt.fromState({
      id: debt.id,
      type: debt.type,
      status: debt.status,
      concept: debt.concept,
      originAmount: debt.originAmount,
      currentBalance: debt.currentBalance,
      currency: debt.currency,
      dueDate: debt.dueDate,
      teamId: debt.teamId,
      profileId: debt.profileId,
      registrationId: debt.registrationId,
      matchId: debt.matchId,
      friendlyId: debt.friendlyId,
      sanctionId: debt.sanctionId,
      parentDebtId: debt.parentDebtId,
      notes: debt.notes,
      metadata: debt.metadata,
      createdByProfileId: debt.createdByProfileId,
      createdAt: debt.createdAt,
      updatedAt: debt.updatedAt,
      deletedAt: debt.deletedAt,
    });
    const result = domain.applyPayment(amount);

    const updated = await this.repo.applyPayment(
      debt.id,
      amount,
      input.paidByProfileId,
    );

    if (result.fullyPaid) {
      const payload: DomainEventPayloads['debt.fully.paid'] = {
        debtId: debt.id,
      };
      this.eventEmitter.emit(DomainEvent.DEBT_FULLY_PAID, payload);
      this.logger.log(`Debt ${debt.id} fully paid (status=PAID)`);
    } else {
      const payload: DomainEventPayloads['debt.partially.paid'] = {
        debtId: debt.id,
        paidAmount: Number(amount.toString()),
        remainingBalance: Number(result.newBalance.toString()),
      };
      this.eventEmitter.emit(DomainEvent.DEBT_PARTIALLY_PAID, payload);
      this.logger.log(
        `Debt ${debt.id} partially paid (status=PARTIALLY_PAID, remaining=${result.newBalance.toString()})`,
      );
    }

    return updated;
  }
}

function toDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}
