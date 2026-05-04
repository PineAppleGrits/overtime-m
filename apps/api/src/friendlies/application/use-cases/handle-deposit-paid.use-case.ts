import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  FRIENDLY_REPOSITORY,
  FriendlyWithDeposits,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';
import {
  FRIENDLY_DEPOSIT_SERVICE,
  IFriendlyDepositService,
} from '../ports/friendly-deposit-service.port';
import {
  FRIENDLY_MATCH_SERVICE,
  IFriendlyMatchService,
} from '../ports/friendly-match.port';

export interface HandleDepositPaidInput {
  /** Debt cuyo pago fue aprobado (puede no ser un FRIENDLY_DEPOSIT). */
  debtId: string;
}

/**
 * Listener handler — se invoca cuando llega `payment.approved` y el debtId
 * pertenece a una FRIENDLY_DEPOSIT.
 *
 * Estados:
 * - Si es la primera seña paga: Friendly.status = PENDING_CONFIRMATION,
 *   emite `friendly.deposit.paid`.
 * - Si es la segunda (ambas pagas): crea Match con matchType='amistoso',
 *   setea Friendly.status=CONFIRMED + resultingMatchId, emite
 *   `friendly.deposit.paid` y `friendly.confirmed`.
 */
@Injectable()
export class HandleDepositPaidUseCase {
  private readonly logger = new Logger(HandleDepositPaidUseCase.name);

  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    @Inject(FRIENDLY_DEPOSIT_SERVICE)
    private readonly depositService: IFriendlyDepositService,
    @Inject(FRIENDLY_MATCH_SERVICE)
    private readonly matchService: IFriendlyMatchService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: HandleDepositPaidInput): Promise<void> {
    const debt = await this.depositService.findDepositById(input.debtId);
    if (!debt) return; // not a FRIENDLY_DEPOSIT — ignore

    if (debt.type !== 'FRIENDLY_DEPOSIT') return;
    if (!debt.friendlyId) {
      this.logger.warn(
        `Debt ${input.debtId} es FRIENDLY_DEPOSIT pero no tiene friendlyId — ignorando`,
      );
      return;
    }

    const friendly = await this.repo.findById(debt.friendlyId);
    if (!friendly) {
      this.logger.warn(
        `Friendly ${debt.friendlyId} referenciado por debt ${input.debtId} no encontrado`,
      );
      return;
    }

    // Si el amistoso ya está CONFIRMED/CANCELLED/EXPIRED/PLAYED el evento es ruido
    if (
      friendly.status !== 'GENERATED' &&
      friendly.status !== 'PENDING_CONFIRMATION'
    ) {
      this.logger.log(
        `Friendly ${friendly.id} en estado ${friendly.status} — ignorando deposit.paid`,
      );
      return;
    }

    const deposits = await this.depositService.listByFriendly(friendly.id);
    const paidCount = deposits.filter((d) => d.status === 'PAID').length;

    if (paidCount === 0) {
      // Inconsistencia (el debt acaba de pagarse) — log y volver
      this.logger.warn(
        `Friendly ${friendly.id} — listByFriendly retornó 0 pagas pese a payment.approved del debt ${input.debtId}`,
      );
      return;
    }

    const teamId = debt.teamId ?? null;
    const depositPaidPayload: DomainEventPayloads['friendly.deposit.paid'] = {
      friendlyId: friendly.id,
      teamId: teamId ?? '',
      debtId: input.debtId,
    };

    if (paidCount === 1) {
      // Primera seña — pasar a PENDING_CONFIRMATION
      await this.repo.updateState(friendly.id, {
        status: 'PENDING_CONFIRMATION',
      });
      this.eventEmitter.emit(
        DomainEvent.FRIENDLY_DEPOSIT_PAID,
        depositPaidPayload,
      );
      this.logger.log(
        `Friendly ${friendly.id} — primera seña paga (${input.debtId}), status=PENDING_CONFIRMATION`,
      );
      return;
    }

    if (paidCount >= 2) {
      // Ambas señas pagas — confirmar y crear Match.
      // Validamos que efectivamente las dos sean de equipos distintos.
      const paidTeams = new Set(
        deposits
          .filter((d) => d.status === 'PAID')
          .map((d) => d.teamId)
          .filter(Boolean),
      );
      if (paidTeams.size < 2) {
        // Caso anómalo: dos pagos del mismo equipo. Mantenemos como
        // PENDING_CONFIRMATION y logueamos.
        this.logger.error(
          `Friendly ${friendly.id} — paidCount=${paidCount} pero sólo ${paidTeams.size} equipos distintos pagaron`,
        );
        if (friendly.status === 'GENERATED') {
          await this.repo.updateState(friendly.id, {
            status: 'PENDING_CONFIRMATION',
          });
        }
        return;
      }

      // Crear Match
      let createdMatch: { id: string };
      try {
        createdMatch = await this.matchService.createFriendlyMatch({
          friendlyId: friendly.id,
          homeTeamId: friendly.homeTeamId,
          awayTeamId: friendly.awayTeamId,
          matchDate: friendly.proposedDate,
          venueId: friendly.venueId,
        });
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Friendly ${friendly.id} — error creando Match: ${error.message}`,
          error.stack,
        );
        throw new BusinessError(
          ErrorCode.INTERNAL_ERROR,
          'No se pudo materializar el partido del amistoso',
          HttpStatus.INTERNAL_SERVER_ERROR,
          { friendlyId: friendly.id },
        );
      }

      await this.repo.confirmWithMatch(friendly.id, createdMatch.id);

      this.eventEmitter.emit(
        DomainEvent.FRIENDLY_DEPOSIT_PAID,
        depositPaidPayload,
      );
      this.eventEmitter.emit(DomainEvent.FRIENDLY_CONFIRMED, {
        friendlyId: friendly.id,
        resultingMatchId: createdMatch.id,
      } satisfies DomainEventPayloads['friendly.confirmed']);

      this.logger.log(
        `Friendly ${friendly.id} CONFIRMED — match ${createdMatch.id} creado`,
      );
    }
  }
}

// Re-export types for tests/listeners conveniencia
export type { FriendlyWithDeposits } from '../ports/friendly-repository.port';
