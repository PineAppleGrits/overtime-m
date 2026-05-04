import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Payment } from '../../domain/entities/payment.entity';
import {
  isValidPaymentMethod,
  normalizeMethod,
} from '../../domain/rules/method-validation.rules';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
  PaymentWithRelations,
} from '../ports/payment-repository.port';

export interface MarkAsFailedInput {
  paymentId: string;
  reason: string;
}

/**
 * Marca un pago como `fallido`. No toca la Debt (la deuda sigue activa).
 * Emite `PAYMENT_REJECTED`.
 */
@Injectable()
export class MarkAsFailedUseCase {
  private readonly logger = new Logger(MarkAsFailedUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: MarkAsFailedInput): Promise<PaymentWithRelations> {
    const found = await this.repo.findById(input.paymentId);
    if (!found) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Pago ${input.paymentId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!isValidPaymentMethod(found.method)) {
      throw new BusinessError(
        ErrorCode.PAYMENT_METHOD_INVALID,
        `Método de pago inválido: ${found.method}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const method = normalizeMethod(found.method as never);

    const domain = Payment.fromState({
      id: found.id,
      debtId: found.debtId,
      registrationId: found.registrationId,
      matchId: found.matchId,
      profileId: found.profileId,
      amount: new Prisma.Decimal(found.amount),
      currency: found.currency,
      method,
      status: found.status as never,
      providerPaymentId: found.providerPaymentId,
      providerResponse: found.providerResponse,
      processedAt: found.processedAt,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });

    if (!domain.canTransitionTo('fallido')) {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        `El pago no puede transicionar a fallido desde ${found.status}`,
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.repo.update(found.id, {
      status: 'fallido',
      providerResponse: {
        ...((found.providerResponse as Record<string, unknown> | null) ?? {}),
        failedAt: new Date().toISOString(),
        failureReason: input.reason,
      } as Prisma.InputJsonValue,
    });

    const payload: DomainEventPayloads['payment.rejected'] = {
      paymentId: updated.id,
      reason: input.reason,
    };
    this.eventEmitter.emit(DomainEvent.PAYMENT_REJECTED, payload);

    this.logger.log(`Payment ${updated.id} marcado como fallido (${input.reason})`);
    return updated;
  }
}
