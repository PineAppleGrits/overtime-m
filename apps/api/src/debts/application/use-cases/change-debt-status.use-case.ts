import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DebtStatus } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  DEBT_REPOSITORY,
  DebtWithRelations,
  IDebtRepository,
} from '../ports/debt-repository.port';
import { isAdminAllowedTransition } from '../../domain/rules/transitions';

export interface ChangeDebtStatusInput {
  debtId: string;
  toStatus: DebtStatus;
  reason?: string;
  byProfileId: string;
}

/**
 * Cambio de estado manual de una Debt (RN-031).
 *
 * Transiciones admitidas (subset administrativo):
 * - APPROVED → DELETED_BY_ERROR
 * - APPROVED → DELETED_WITH_RECORD
 * - APPROVED → CANCELLED
 * - PARTIALLY_PAID → CANCELLED
 *
 * Las transiciones a PAID/PARTIALLY_PAID NO son admitidas acá — esas las
 * dispara `applyPaymentToDebt` automáticamente.
 *
 * Auditoría: cada cambio crea una `DebtAudit` con `fromStatus`, `toStatus`,
 * `reason` y `byProfileId` (RN-031).
 *
 * Evento: `debt.cancelled` cuando el toStatus es CANCELLED.
 */
@Injectable()
export class ChangeDebtStatusUseCase {
  private readonly logger = new Logger(ChangeDebtStatusUseCase.name);

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: ChangeDebtStatusInput,
  ): Promise<DebtWithRelations> {
    const debt = await this.repo.findById(input.debtId);
    if (!debt) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Deuda ${input.debtId} no encontrada`,
        HttpStatus.NOT_FOUND,
        { debtId: input.debtId },
      );
    }

    if (!isAdminAllowedTransition(debt.status, input.toStatus)) {
      throw new BusinessError(
        ErrorCode.DEBT_INVALID_STATUS_TRANSITION,
        `No se puede transicionar de ${debt.status} a ${input.toStatus}`,
        HttpStatus.CONFLICT,
        {
          debtId: debt.id,
          fromStatus: debt.status,
          toStatus: input.toStatus,
        },
      );
    }

    const updated = await this.repo.changeStatus(
      debt.id,
      debt.status,
      input.toStatus,
      input.byProfileId,
      input.reason,
    );

    if (input.toStatus === 'CANCELLED') {
      const payload: DomainEventPayloads['debt.cancelled'] = {
        debtId: debt.id,
        reason: input.reason,
      };
      this.eventEmitter.emit(DomainEvent.DEBT_CANCELLED, payload);
    }

    this.logger.log(
      `Debt ${debt.id} status: ${debt.status} → ${input.toStatus} (by ${input.byProfileId})`,
    );

    return updated;
  }
}
