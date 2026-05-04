import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DebtType, Prisma } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  DEBT_REPOSITORY,
  DebtWithRelations,
  IDebtRepository,
} from '../ports/debt-repository.port';

export interface CreateDebtInternalInput {
  type: DebtType;
  concept: string;
  /** Monto en unidades enteras o decimales (ARS). Se convierte a Decimal internamente. */
  originAmount: number | string | Prisma.Decimal;
  dueDate: Date;
  currency?: string;
  teamId?: string | null;
  profileId?: string | null;
  registrationId?: string | null;
  matchId?: string | null;
  friendlyId?: string | null;
  sanctionId?: string | null;
  parentDebtId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  /**
   * Profile que dispara la creación. Para los crons internos pasamos un
   * profileId "system" (resuelto por el caller).
   */
  createdByProfileId: string;
}

/**
 * Crea una Debt sin pasar por endpoint admin. Lo usan otras features
 * (registrations, friendlies, matches, sanctions) para emitir cargos
 * automáticos.
 *
 * Reglas:
 * - Al menos uno de `teamId`/`profileId` debe estar presente.
 * - `originAmount > 0`.
 * - `currentBalance` se inicializa igual a `originAmount`.
 * - `status = APPROVED` por defecto.
 * - Emite `debt.created`.
 */
@Injectable()
export class CreateDebtInternalUseCase {
  private readonly logger = new Logger(CreateDebtInternalUseCase.name);

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: CreateDebtInternalInput,
  ): Promise<DebtWithRelations> {
    if (!input.teamId && !input.profileId) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Al menos uno de teamId/profileId debe estar presente',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amount = toDecimal(input.originAmount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'El monto debe ser mayor a 0',
        HttpStatus.BAD_REQUEST,
        { originAmount: amount.toString() },
      );
    }

    const debt = await this.repo.create({
      type: input.type,
      concept: input.concept,
      originAmount: amount,
      currentBalance: amount,
      currency: input.currency ?? 'ARS',
      dueDate: input.dueDate,
      teamId: input.teamId ?? null,
      profileId: input.profileId ?? null,
      registrationId: input.registrationId ?? null,
      matchId: input.matchId ?? null,
      friendlyId: input.friendlyId ?? null,
      sanctionId: input.sanctionId ?? null,
      parentDebtId: input.parentDebtId ?? null,
      notes: input.notes ?? null,
      metadata: (input.metadata ?? null) as Prisma.InputJsonValue | null,
      createdByProfileId: input.createdByProfileId,
      status: 'APPROVED',
    });

    const payload: DomainEventPayloads['debt.created'] = {
      debtId: debt.id,
      type: debt.type,
      amount: Number(amount.toString()),
      teamId: debt.teamId ?? undefined,
      profileId: debt.profileId ?? undefined,
    };
    this.eventEmitter.emit(DomainEvent.DEBT_CREATED, payload);

    this.logger.log(
      `Debt creada (${debt.id}) tipo=${debt.type} monto=${amount.toString()} team=${debt.teamId ?? '-'} profile=${debt.profileId ?? '-'}`,
    );

    return debt;
  }
}

function toDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}
