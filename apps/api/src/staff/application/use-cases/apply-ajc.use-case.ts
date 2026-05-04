import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { computeAjcFee } from '../../domain/rules/ajc-formula.rules';
import { DEBTS_PORT, IDebtsPort } from '../ports/debts.port';
import {
  ISanctionsPort,
  SANCTIONS_PORT,
} from '../ports/sanctions.port';

export interface ApplyAjcInput {
  profileId: string;
  sanctionId: string;
  refereeSalary: number;
  fechasToFree: number;
  appliedByProfileId: string;
  /** Cantidad total de fechas de la sanción — opcional, si el caller la conoce. */
  sanctionTotalFechas?: number;
}

export interface ApplyAjcOutput {
  debtId: string;
  amount: number;
  fechasFreed: number;
  sanctionId: string;
}

/**
 * RN-030 — Aplica el AJC a un jugador suspendido.
 *
 * Pasos:
 * 1. Validar inputs (sueldo > 0, fechas > 0).
 * 2. Validar la sanción: existe, kind=DISCIPLINARY, status=ACTIVE, vigente.
 * 3. Calcular monto = sueldo × fechasToFree.
 * 4. Crear Debt vía `IDebtsPort.createAjcDebt` (W2.1 DebtsService).
 * 5. Anotar en la Sanction la metadata del AJC aplicado.
 * 6. Emitir evento `sanction.ajc.applied`.
 *
 * Pendientes:
 * - DP-007: cantidad mínima de fechas cumplidas para habilitar AJC. Mientras
 *   está abierta, NO bloqueamos por ese chequeo.
 * - La lógica de "cuántas fechas restan tras el AJC" depende del modelo de
 *   sanciones (W3.3) — aquí solo dejamos el rastro y lanzamos el evento.
 */
@Injectable()
export class ApplyAjcUseCase {
  private readonly logger = new Logger(ApplyAjcUseCase.name);

  constructor(
    @Inject(SANCTIONS_PORT)
    private readonly sanctionsPort: ISanctionsPort,
    @Inject(DEBTS_PORT)
    private readonly debtsPort: IDebtsPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: ApplyAjcInput): Promise<ApplyAjcOutput> {
    if (!Number.isFinite(input.refereeSalary) || input.refereeSalary <= 0) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'refereeSalary debe ser un número > 0',
        HttpStatus.BAD_REQUEST,
        { refereeSalary: input.refereeSalary },
      );
    }
    if (!Number.isInteger(input.fechasToFree) || input.fechasToFree <= 0) {
      throw new BusinessError(
        ErrorCode.AJC_INVALID_FECHAS,
        'fechasToFree debe ser un entero > 0',
        HttpStatus.BAD_REQUEST,
        { fechasToFree: input.fechasToFree },
      );
    }

    const sanction = await this.sanctionsPort.findById(input.sanctionId);
    if (!sanction) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Sanción ${input.sanctionId} no encontrada`,
        HttpStatus.NOT_FOUND,
        { sanctionId: input.sanctionId },
      );
    }

    if (sanction.kind !== 'DISCIPLINARY') {
      throw new BusinessError(
        ErrorCode.AJC_INVALID_SANCTION,
        'El AJC solo aplica a sanciones disciplinarias',
        HttpStatus.BAD_REQUEST,
        { sanctionKind: sanction.kind },
      );
    }
    if (sanction.status !== 'ACTIVE') {
      throw new BusinessError(
        ErrorCode.AJC_INVALID_SANCTION,
        'La sanción no está activa',
        HttpStatus.BAD_REQUEST,
        { sanctionStatus: sanction.status },
      );
    }
    if (sanction.targetProfileId !== input.profileId) {
      throw new BusinessError(
        ErrorCode.AJC_INVALID_SANCTION,
        'La sanción no corresponde a este jugador',
        HttpStatus.BAD_REQUEST,
        {
          sanctionTargetProfileId: sanction.targetProfileId,
          profileId: input.profileId,
        },
      );
    }

    // Sanción vencida temporalmente: si ya pasó endsAt, no tiene sentido AJC.
    if (sanction.endsAt && sanction.endsAt.getTime() <= Date.now()) {
      throw new BusinessError(
        ErrorCode.AJC_INVALID_SANCTION,
        'La sanción ya finalizó (endsAt en el pasado)',
        HttpStatus.BAD_REQUEST,
        { endsAt: sanction.endsAt },
      );
    }

    // Si conocemos el total de fechas, evitar liberar más que el remanente.
    if (
      typeof input.sanctionTotalFechas === 'number' &&
      input.fechasToFree > input.sanctionTotalFechas
    ) {
      throw new BusinessError(
        ErrorCode.AJC_INVALID_FECHAS,
        'fechasToFree excede el total de fechas de la sanción',
        HttpStatus.BAD_REQUEST,
        {
          fechasToFree: input.fechasToFree,
          sanctionTotalFechas: input.sanctionTotalFechas,
        },
      );
    }

    // TODO: DP-007 — validar X fechas cumplidas antes de habilitar AJC.
    // Mientras la decisión está abierta, no bloqueamos.

    const amount = computeAjcFee(input.refereeSalary, input.fechasToFree);

    const debt = await this.debtsPort.createAjcDebt({
      profileId: input.profileId,
      sanctionId: input.sanctionId,
      amount,
      refereeSalary: input.refereeSalary,
      fechasFreed: input.fechasToFree,
      appliedByProfileId: input.appliedByProfileId,
    });

    await this.sanctionsPort.markAjcApplied({
      sanctionId: input.sanctionId,
      fechasFreed: input.fechasToFree,
      appliedAt: new Date(),
      appliedBy: input.appliedByProfileId,
      refereeSalary: input.refereeSalary,
      ajcAmount: amount,
      ajcDebtId: debt.id,
    });

    const payload: DomainEventPayloads['sanction.ajc.applied'] = {
      sanctionId: input.sanctionId,
      profileId: input.profileId,
      debtId: debt.id,
      refereeSalary: input.refereeSalary,
      fechasFreed: input.fechasToFree,
      amount,
      appliedBy: input.appliedByProfileId,
    };
    this.eventEmitter.emit(DomainEvent.AJC_APPLIED, payload);

    this.logger.log(
      `AJC aplicado: sanción=${input.sanctionId} profile=${input.profileId} fechas=${input.fechasToFree} monto=${amount} debt=${debt.id}`,
    );

    return {
      debtId: debt.id,
      amount,
      fechasFreed: input.fechasToFree,
      sanctionId: input.sanctionId,
    };
  }
}
