import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  ISanctionRepository,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

export interface ApplyAjcToSanctionInput {
  sanctionId: string;
  fechasFreed: number;
  refereeSalary: number;
  amount: number;
  ajcDebtId: string;
  appliedByProfileId: string;
}

/**
 * Caso de uso interno: listener de `sanction.ajc.applied`.
 *
 * Ya creó el Debt el módulo W3.2. Acá solo:
 * 1. Anotamos el AJC en `notes` (rastro).
 * 2. Sumamos `fechasFreed` al contador (si la sanción tiene contador inicializado).
 * 3. Si llega al total, se auto-resuelve.
 */
@Injectable()
export class ApplyAjcToSanctionUseCase {
  private readonly logger = new Logger(ApplyAjcToSanctionUseCase.name);

  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: ApplyAjcToSanctionInput): Promise<void> {
    const sanction = await this.repo.findById(input.sanctionId);
    if (!sanction) {
      this.logger.warn(
        `AJC aplicado pero sanción ${input.sanctionId} no encontrada`,
      );
      return;
    }

    const stamp = `[AJC ${new Date().toISOString()}] fechasFreed=${input.fechasFreed} refereeSalary=$${input.refereeSalary} amount=$${input.amount} debtId=${input.ajcDebtId} appliedBy=${input.appliedByProfileId}`;
    sanction.appendAjcStamp(stamp);

    const state = sanction.readFechas();
    if (state && state.fechasCumplidas < state.totalFechas) {
      try {
        const remaining = state.totalFechas - state.fechasCumplidas;
        const delta = Math.min(input.fechasFreed, remaining);
        const result = sanction.addFechas(delta);

        const payload: DomainEventPayloads['sanction.fechaCumplida.added'] = {
          sanctionId: input.sanctionId,
          matchId: 'AJC',
          fechasCumplidas: result.state.fechasCumplidas,
          totalFechas: result.state.totalFechas,
          autoResolved: result.autoResolved,
        };
        this.eventEmitter.emit(DomainEvent.SANCTION_FECHA_CUMPLIDA, payload);

        if (result.autoResolved) {
          this.eventEmitter.emit(DomainEvent.SANCTION_RESOLVED, {
            sanctionId: input.sanctionId,
            resolvedBy: input.appliedByProfileId,
          } satisfies DomainEventPayloads['sanction.resolved']);
        }
      } catch (err) {
        this.logger.warn(
          `No se pudo sumar AJC al contador de sanción ${input.sanctionId}: ${(err as Error).message}`,
        );
      }
    }

    await this.repo.save(sanction);
    this.logger.log(
      `AJC anotado en sanción ${input.sanctionId} (debt=${input.ajcDebtId})`,
    );
  }
}
