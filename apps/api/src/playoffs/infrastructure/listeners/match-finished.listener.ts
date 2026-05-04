import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  AdvanceOnWinnerUseCase,
} from '../../application/use-cases/advance-on-winner.use-case';
import {
  GeneratePromotionPlayoffUseCase,
} from '../../application/use-cases/generate-promotion-playoff.use-case';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Reacciona a `match.finished`:
 * - Si el match pertenece a una serie (seriesId != null), recalcula el
 *   progreso vía `AdvanceOnWinnerUseCase` y propaga el winner.
 *
 * También reacciona a `category.finished` (por si el flujo lo dispara) —
 * pero la generación de repechaje queda como acción explícita admin (DP-005).
 */
@Injectable()
export class PlayoffMatchFinishedListener {
  private readonly logger = new Logger(PlayoffMatchFinishedListener.name);

  constructor(
    private readonly advance: AdvanceOnWinnerUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(DomainEvent.MATCH_FINISHED)
  async onMatchFinished(
    payload: DomainEventPayloads['match.finished'],
  ): Promise<void> {
    try {
      await this.advance.execute({ matchId: payload.matchId });
    } catch (err) {
      this.logger.error(
        `Error advancing series for match ${payload.matchId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
