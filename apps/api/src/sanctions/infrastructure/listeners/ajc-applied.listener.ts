import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { ApplyAjcToSanctionUseCase } from '../../application/use-cases/apply-ajc-to-sanction.use-case';

/**
 * RN-030 — Listener de `sanction.ajc.applied` (emitido por W3.2 staff).
 *
 * Anota el rastro AJC en la sanción y suma `fechasFreed` al contador de
 * fechas cumplidas. Si llega al total, la sanción se auto-resuelve.
 */
@Injectable()
export class AjcAppliedListener {
  private readonly logger = new Logger(AjcAppliedListener.name);

  constructor(private readonly applyAjc: ApplyAjcToSanctionUseCase) {}

  @OnEvent(DomainEvent.AJC_APPLIED)
  async onAjcApplied(
    payload: DomainEventPayloads['sanction.ajc.applied'],
  ): Promise<void> {
    try {
      await this.applyAjc.execute({
        sanctionId: payload.sanctionId,
        fechasFreed: payload.fechasFreed,
        refereeSalary: payload.refereeSalary,
        amount: payload.amount,
        ajcDebtId: payload.debtId,
        appliedByProfileId: payload.appliedBy,
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `Error aplicando AJC a sanción ${payload.sanctionId}: ${e.message}`,
        e.stack,
      );
    }
  }
}
