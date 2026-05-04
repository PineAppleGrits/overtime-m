import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlayoffSeriesStatus } from '@prisma/client';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  GAMES_PER_FORMAT,
} from '../../domain/rules/bracket-generation.rules';
import { computeSeriesProgress } from '../../domain/rules/series-progression.rules';
import {
  IPlayoffRepository,
  PLAYOFF_REPOSITORY,
} from '../ports/playoff-repository.port';
import { PrismaService } from '../../../database/prisma.service';

export interface AdvanceOnWinnerInput {
  matchId: string;
}

/**
 * Reaccion al evento `match.finished` cuando el match pertenece a una serie
 * de playoff. Recalcula el progreso de la serie:
 *
 * - Si alguien alcanzó wins-to-clinch, marca la serie como COMPLETED y
 *   propaga el winner a las series alimentadas (feedsFromA/B).
 * - Si todas las series alimentadas ya tienen ambos slots, las pone en
 *   READY y crea sus matches físicos.
 */
@Injectable()
export class AdvanceOnWinnerUseCase {
  private readonly logger = new Logger(AdvanceOnWinnerUseCase.name);

  constructor(
    @Inject(PLAYOFF_REPOSITORY)
    private readonly repo: IPlayoffRepository,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: AdvanceOnWinnerInput): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: input.matchId },
      include: { series: true },
    });
    if (!match || !match.seriesId) {
      // No es de playoff, nada que hacer
      return;
    }

    const series = await this.repo.findSeriesById(match.seriesId);
    if (!series) {
      this.logger.warn(`Series ${match.seriesId} not found for match ${match.id}`);
      return;
    }
    if (series.status === PlayoffSeriesStatus.COMPLETED) {
      // Ya estaba cerrada, nada que recalcular
      return;
    }

    const seriesMatches = await this.prisma.match.findMany({
      where: { seriesId: series.id, deletedAt: null },
      orderBy: { seriesGameNumber: 'asc' },
    });

    const progress = computeSeriesProgress(
      series.homeTeamId,
      series.awayTeamId,
      series.format,
      seriesMatches.map((m) => ({
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        countsForStandings: !(m.homeScore === 0 && m.awayScore === 0),
        status: m.status,
      })),
    );

    if (!progress.isCompleted) {
      // Si no terminó, asegurar que esté IN_PROGRESS si tiene al menos un match jugado
      const playedAny = seriesMatches.some((m) =>
        ['en_curso', 'finalizado', 'finalizado_con_resolucion'].includes(
          m.status,
        ),
      );
      if (
        playedAny &&
        series.status !== PlayoffSeriesStatus.IN_PROGRESS
      ) {
        await this.repo.setSeriesStatus(
          series.id,
          PlayoffSeriesStatus.IN_PROGRESS,
        );
      }
      return;
    }

    if (!progress.winnerTeamId) {
      // Caso BO1 0-0 — necesita tiebreaker manual
      this.logger.warn(
        `Series ${series.id} needs tiebreaker (BO1 ended 0-0).`,
      );
      return;
    }

    // Marcar serie como completada
    await this.repo.markSeriesCompleted(series.id, progress.winnerTeamId);

    this.events.emit(DomainEvent.PLAYOFF_SERIES_COMPLETED, {
      seriesId: series.id,
      categoryId: series.categoryId,
      winnerTeamId: progress.winnerTeamId,
      loserTeamId: progress.loserTeamId,
    } satisfies DomainEventPayloads['playoff.series.completed']);

    // Propagar a series alimentadas
    const downstream = await this.repo.findSeriesFedByCompletedSeries(
      series.id,
    );
    for (const fed of downstream) {
      let newHome = fed.homeTeamId;
      let newAway = fed.awayTeamId;
      if (fed.feedsFromSeriesAId === series.id) {
        newHome = progress.winnerTeamId;
      }
      if (fed.feedsFromSeriesBId === series.id) {
        newAway = progress.winnerTeamId;
      }

      const ready = Boolean(newHome) && Boolean(newAway);
      const status = ready
        ? PlayoffSeriesStatus.READY
        : PlayoffSeriesStatus.PENDING;

      await this.repo.assignTeams(fed.id, newHome, newAway, status);

      if (ready && fed.matchesDirect.length === 0) {
        // Crear matches físicos para esta serie ahora que tenemos los teams
        const games = GAMES_PER_FORMAT[fed.format];
        const baseDate = new Date();
        baseDate.setUTCDate(baseDate.getUTCDate() + 7); // 7 días como default
        await this.repo.createSeriesMatches({
          seriesId: fed.id,
          categoryId: fed.categoryId,
          zoneId: null,
          homeTeamId: newHome!,
          awayTeamId: newAway!,
          matchType: 'playoff',
          playoffStage: fed.round,
          games,
          baseDate,
        });
      }
    }
  }
}

export class TiebreakerNeededError extends BusinessError {
  constructor(seriesId: string) {
    super(
      ErrorCode.PLAYOFF_SERIES_NOT_TIE,
      'La serie BO1 terminó 0-0 — requiere tiebreaker manual.',
      HttpStatus.CONFLICT,
      { seriesId },
    );
  }
}
