import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { DebtsService } from '../../../debts/application/services/debts.service';
import { Payment } from '../../domain/entities/payment.entity';
import {
  PaymentMethodValue,
  isValidPaymentMethod,
  normalizeMethod,
} from '../../domain/rules/method-validation.rules';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
  PaymentWithRelations,
} from '../ports/payment-repository.port';
import {
  IRegistrationContextPort,
  REGISTRATION_CONTEXT_PORT,
} from '../ports/registration-context.port';

export interface MarkAsPaidInput {
  paymentId: string;
  adminId: string;
  externalReference?: string;
  notes?: string;
}

/**
 * Marca un pago como `procesado` (admin manual — efectivo / transferencia /
 * other). Si el pago tiene `debtId`, llama a `DebtsService.applyPayment` para
 * descontar saldo + audit + emitir `debt.partially.paid`/`debt.fully.paid`.
 *
 * Si el método es `mercadopago`, se rechaza: ese flujo lo maneja el webhook.
 *
 * Eventos: emite `PAYMENT_APPROVED`.
 */
@Injectable()
export class MarkAsPaidUseCase {
  private readonly logger = new Logger(MarkAsPaidUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    private readonly debtsService: DebtsService,
    @Inject(REGISTRATION_CONTEXT_PORT)
    private readonly registrationCtx: IRegistrationContextPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: MarkAsPaidInput): Promise<PaymentWithRelations> {
    const found = await this.repo.findById(input.paymentId);
    if (!found) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Pago ${input.paymentId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { paymentId: input.paymentId },
      );
    }

    if (!isValidPaymentMethod(found.method)) {
      throw new BusinessError(
        ErrorCode.PAYMENT_METHOD_INVALID,
        `Método de pago inválido: ${found.method}`,
        HttpStatus.BAD_REQUEST,
        { method: found.method },
      );
    }

    const method: PaymentMethodValue = normalizeMethod(
      found.method as PaymentMethodValue,
    );

    if (method === 'mercadopago') {
      throw new BusinessError(
        ErrorCode.PAYMENT_METHOD_INVALID,
        'Pagos por MercadoPago se procesan vía webhook',
        HttpStatus.BAD_REQUEST,
        { paymentId: found.id, method },
      );
    }

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

    if (!domain.canBeApproved()) {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        `El pago no puede ser aprobado en estado ${found.status}`,
        HttpStatus.CONFLICT,
        { paymentId: found.id, status: found.status },
      );
    }

    const result = domain.markPaid();

    const updated = await this.repo.update(found.id, {
      status: result.newStatus,
      processedAt: result.processedAt,
      providerResponse: {
        ...((found.providerResponse as Record<string, unknown> | null) ?? {}),
        markedBy: input.adminId,
        markedAt: result.processedAt.toISOString(),
        externalReference: input.externalReference ?? null,
        notes: input.notes ?? null,
      } as Prisma.InputJsonValue,
    });

    // Aplicar pago a la deuda (W2.1 hace audit y emite debt.partially.paid /
    // debt.fully.paid). Si falla acá, el Payment ya quedó como procesado en BD;
    // el log permite intervención manual. Decisión consciente: priorizamos no
    // bloquear al admin si la deuda está corrupta.
    if (found.debtId) {
      try {
        await this.debtsService.applyPayment({
          debtId: found.debtId,
          amount: new Prisma.Decimal(found.amount),
          paidByProfileId: input.adminId,
        });
      } catch (err) {
        const e = err as Error;
        this.logger.error(
          `Payment ${found.id} aprobado pero applyPayment a debt ${found.debtId} falló: ${e.message}`,
          e.stack,
        );
      }
    } else if (found.registrationId) {
      // Legacy: marcar registration como pagada (RN-015 cuando se migre a
      // RegistrationPaymentsService).
      try {
        await this.registrationCtx.markPaid(found.registrationId);
      } catch (err) {
        // Best-effort.
      }
    }

    const payload: DomainEventPayloads['payment.approved'] = {
      paymentId: updated.id,
      debtId: updated.debtId ?? undefined,
      approvedBy: input.adminId,
      method,
    };
    this.eventEmitter.emit(DomainEvent.PAYMENT_APPROVED, payload);

    this.logger.log(
      `Payment ${updated.id} marcado como procesado por admin ${input.adminId} (debt=${updated.debtId ?? '-'})`,
    );

    return updated;
  }
}
