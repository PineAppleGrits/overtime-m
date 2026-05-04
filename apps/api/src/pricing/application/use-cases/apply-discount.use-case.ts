import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  DomainEvent,
  DomainEventPayloads,
} from '../../../common/events/domain-events';
import {
  DISCOUNT_METADATA_KIND,
  toDisplayDiscountAmount,
  validateDiscountAmount,
} from '../../domain/rules/discount-amount.rules';
import {
  CreateDiscountInput,
  DISCOUNT_REPOSITORY,
  DiscountRecord,
  IDiscountRepository,
} from '../ports/discount-repository.port';

export interface ApplyDiscountInput {
  teamId: string;
  /** Monto positivo. El repo lo guarda como negativo en `Debt`. */
  amount: number;
  currency?: string;
  concept: string;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  sourceDebtId?: string;
  createdByProfileId: string;
  dueDate?: Date;
}

/**
 * RN-020 — aplica un descuento manual a un equipo.
 *
 * Persiste como `Debt` con `type=OTHER_MANUAL`, `metadata.kind='DISCOUNT'`,
 * `originAmount` y `currentBalance` negativos. Emite `DEBT_CREATED` con
 * `metadata.kind='DISCOUNT'` para que listeners del módulo Debts puedan
 * actuar (ej. recalcular saldo neto).
 */
@Injectable()
export class ApplyDiscountUseCase {
  private readonly logger = new Logger(ApplyDiscountUseCase.name);

  constructor(
    @Inject(DISCOUNT_REPOSITORY)
    private readonly discountRepo: IDiscountRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: ApplyDiscountInput): Promise<DiscountRecord> {
    const validationError = validateDiscountAmount(input.amount);
    if (validationError) {
      throw new BusinessError(
        ErrorCode.DISCOUNT_AMOUNT_INVALID,
        this.messageFor(validationError.reason),
        HttpStatus.BAD_REQUEST,
        { amount: input.amount, reason: validationError.reason },
      );
    }

    const repoInput: CreateDiscountInput = {
      teamId: input.teamId,
      amount: input.amount,
      currency: input.currency,
      concept: input.concept,
      notes: input.notes ?? null,
      metadata: input.metadata,
      sourceDebtId: input.sourceDebtId,
      createdByProfileId: input.createdByProfileId,
      dueDate: input.dueDate,
    };

    const created = await this.discountRepo.create(repoInput);

    // Evento — listeners del módulo Debts pueden recalcular saldos.
    this.eventEmitter.emit(DomainEvent.DEBT_CREATED, {
      debtId: created.id,
      type: created.type,
      // Convertimos a positivo para el payload (consumidores leen el monto del descuento).
      amount: toDisplayDiscountAmount(Number(created.originAmount)),
      teamId: created.teamId ?? undefined,
      profileId: created.profileId ?? undefined,
    } satisfies DomainEventPayloads['debt.created']);

    this.logger.log(
      `Discount applied: ${created.id} (team=${input.teamId}, amount=-${input.amount} ${created.currency}, kind=${DISCOUNT_METADATA_KIND})`,
    );

    return created;
  }

  private messageFor(reason: string): string {
    switch (reason) {
      case 'NOT_POSITIVE':
        return 'El monto del descuento debe ser mayor a 0';
      case 'TOO_LARGE':
        return 'El monto del descuento excede el máximo permitido';
      case 'TOO_MANY_DECIMALS':
        return 'El monto del descuento permite hasta 2 decimales';
      case 'NOT_FINITE':
        return 'El monto del descuento no es un número válido';
      default:
        return 'Monto del descuento inválido';
    }
  }
}
