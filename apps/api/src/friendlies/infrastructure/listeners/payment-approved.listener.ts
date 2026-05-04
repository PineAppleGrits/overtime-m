import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { HandleDepositPaidUseCase } from '../../application/use-cases/handle-deposit-paid.use-case';
import { MarkFriendlyPlayedUseCase } from '../../application/use-cases/mark-played.use-case';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Listeners internos del módulo Friendlies sobre eventos externos.
 *
 * - `payment.approved` → si el debt es FRIENDLY_DEPOSIT, dispara
 *    HandleDepositPaidUseCase.
 * - `match.finished` con matchType='amistoso' → marca amistoso como PLAYED.
 */
@Injectable()
export class FriendliesEventListener {
  private readonly logger = new Logger(FriendliesEventListener.name);

  constructor(
    private readonly handleDepositPaid: HandleDepositPaidUseCase,
    private readonly markPlayed: MarkFriendlyPlayedUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(DomainEvent.PAYMENT_APPROVED)
  async onPaymentApproved(
    payload: DomainEventPayloads['payment.approved'],
  ): Promise<void> {
    if (!payload.debtId) return;
    try {
      await this.handleDepositPaid.execute({ debtId: payload.debtId });
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error procesando payment.approved (debt ${payload.debtId}): ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(DomainEvent.MATCH_FINISHED)
  async onMatchFinished(
    payload: DomainEventPayloads['match.finished'],
  ): Promise<void> {
    try {
      // Buscamos si el match es un amistoso vinculado a un Friendly
      const match = await this.prisma.match.findUnique({
        where: { id: payload.matchId },
        select: { matchType: true, resultingFriendly: { select: { id: true } } },
      });
      if (!match || match.matchType !== 'amistoso') return;
      if (!match.resultingFriendly) return;
      await this.markPlayed.execute({
        friendlyId: match.resultingFriendly.id,
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error procesando match.finished para amistoso (match ${payload.matchId}): ${error.message}`,
        error.stack,
      );
    }
  }
}
