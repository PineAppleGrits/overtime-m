import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  ISanctionRepository,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

export interface AddFechaCumplidaInput {
  /** Profile cuyo roster jugó el partido (RN-003 — fecha cumplida solo si estuvo en cancha). */
  profileId: string;
  /** Match cuyo finished disparó el conteo. */
  matchId: string;
  /** Tournament del partido — para limitar a sanciones del mismo torneo. */
  tournamentId?: string;
  /** Cantidad de fechas a sumar (default: 1). */
  delta?: number;
}

/**
 * Caso de uso interno (listener de `match.finished`).
 *
 * Toma todas las sanciones ACTIVE+DISCIPLINARY del jugador que tienen contador
 * de fechas (`metadata.totalFechas`/`fechasCumplidas` embebido en notes) y suma
 * la fecha cumplida.
 *
 * Si la sanción matchea por `tournamentId`, se incrementa.
 *
 * Si `fechasCumplidas >= totalFechas`, la entidad se auto-resuelve y se emite
 * `sanction.resolved` además del propio `sanction.fechaCumplida.added`.
 */
@Injectable()
export class AddFechaCumplidaUseCase {
  private readonly logger = new Logger(AddFechaCumplidaUseCase.name);

  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: AddFechaCumplidaInput): Promise<void> {
    const delta = input.delta ?? 1;
    const sanctions = await this.repo.findActiveForProfile(input.profileId);

    for (const sanction of sanctions) {
      const props = sanction.toProps();
      if (props.kind !== 'DISCIPLINARY') continue;
      // Limitar al torneo del partido cuando la sanción tiene scope torneo.
      if (
        input.tournamentId &&
        props.tournamentId &&
        props.tournamentId !== input.tournamentId
      ) {
        continue;
      }
      const state = sanction.readFechas();
      if (!state || state.fechasCumplidas >= state.totalFechas) continue;

      try {
        const result = sanction.addFechas(delta);
        await this.repo.save(sanction);

        const payload: DomainEventPayloads['sanction.fechaCumplida.added'] = {
          sanctionId: props.id,
          matchId: input.matchId,
          fechasCumplidas: result.state.fechasCumplidas,
          totalFechas: result.state.totalFechas,
          autoResolved: result.autoResolved,
        };
        this.eventEmitter.emit(DomainEvent.SANCTION_FECHA_CUMPLIDA, payload);

        if (result.autoResolved) {
          this.eventEmitter.emit(DomainEvent.SANCTION_RESOLVED, {
            sanctionId: props.id,
            resolvedBy: 'system:fechas-cumplidas',
          } satisfies DomainEventPayloads['sanction.resolved']);
        }

        this.logger.log(
          `Sanción ${props.id} +${delta} fecha → ${result.state.fechasCumplidas}/${result.state.totalFechas}` +
            (result.autoResolved ? ' (auto-resuelta)' : ''),
        );
      } catch (err) {
        this.logger.warn(
          `No se pudo sumar fecha cumplida en sanción ${props.id}: ${(err as Error).message}`,
        );
      }
    }
  }
}
