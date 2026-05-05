import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { PrismaService } from '../../../database/prisma.service';
import { AddFechaCumplidaUseCase } from '../../application/use-cases/add-fecha-cumplida.use-case';

/**
 * RN-003 — Cuando un partido finaliza, sumamos +1 fecha cumplida a las
 * sanciones DISCIPLINARY ACTIVE de los jugadores que estuvieron en el roster
 * (tabla MatchRoster).
 *
 * Reglas:
 * - Solo si `countsForStandings = true` (RN-024 — 0-0 administrativo NO suma fecha).
 * - Solo aplica a sanciones del torneo del partido (las globales no descuentan
 *   con un partido específico salvo que el caller haya seteado tournamentId).
 *
 * Caso especial AJC: el listener `AjcAppliedListener` se encarga de la
 * habilitación anticipada — esto solo cuenta partidos jugados.
 */
@Injectable()
export class MatchFinishedListener {
  private readonly logger = new Logger(MatchFinishedListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly addFecha: AddFechaCumplidaUseCase,
  ) {}

  @OnEvent(DomainEvent.MATCH_FINISHED)
  async onMatchFinished(
    payload: DomainEventPayloads['match.finished'],
  ): Promise<void> {
    if (payload.countsForStandings === false) {
      // RN-024 — 0-0 administrativo no cuenta como fecha cumplida.
      return;
    }

    try {
      const match = await this.prisma.match.findUnique({
        where: { id: payload.matchId },
        select: {
          id: true,
          category: { select: { tournamentId: true } },
          roster: { select: { profileId: true } },
        },
      });
      if (!match) {
        this.logger.warn(`match.finished: match ${payload.matchId} no encontrado`);
        return;
      }

      const tournamentId = match.category?.tournamentId;
      const profileIds = match.roster.map((entry) => entry.profileId);

      if (profileIds.length === 0) {
        this.logger.log(
          `match.finished ${payload.matchId} sin roster — no se cuentan fechas`,
        );
        return;
      }

      for (const profileId of profileIds) {
        await this.addFecha.execute({
          profileId,
          matchId: payload.matchId,
          tournamentId,
          delta: 1,
        });
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `Error procesando match.finished para sanciones (${payload.matchId}): ${e.message}`,
        e.stack,
      );
    }
  }
}
