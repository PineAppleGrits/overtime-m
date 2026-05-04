import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlayoffSeriesStatus } from '@prisma/client';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { computeSeriesProgress } from '../../domain/rules/series-progression.rules';
import {
  IPlayoffRepository,
  PLAYOFF_REPOSITORY,
} from '../ports/playoff-repository.port';
import { PrismaService } from '../../../database/prisma.service';

export interface ResolveTiebreakerInput {
  seriesId: string;
  winnerTeamId: string;
  resolvedBy: string;
}

/**
 * Resuelve manualmente un BO1 0-0 (RN-024) — el admin elige al ganador.
 */
@Injectable()
export class ResolveTiebreakerUseCase {
  private readonly logger = new Logger(ResolveTiebreakerUseCase.name);

  constructor(
    @Inject(PLAYOFF_REPOSITORY)
    private readonly repo: IPlayoffRepository,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: ResolveTiebreakerInput) {
    const series = await this.repo.findSeriesById(input.seriesId);
    if (!series) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Serie no encontrada',
        HttpStatus.NOT_FOUND,
        { seriesId: input.seriesId },
      );
    }

    if (series.status === PlayoffSeriesStatus.COMPLETED) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_SERIES_NOT_TIE,
        'La serie ya está cerrada.',
        HttpStatus.CONFLICT,
        { seriesId: series.id, status: series.status },
      );
    }

    const seriesMatches = await this.prisma.match.findMany({
      where: { seriesId: series.id, deletedAt: null },
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

    if (!progress.needsTiebreaker) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_SERIES_NOT_TIE,
        'La serie no requiere tiebreaker manual.',
        HttpStatus.CONFLICT,
        { seriesId: series.id },
      );
    }

    if (
      input.winnerTeamId !== series.homeTeamId &&
      input.winnerTeamId !== series.awayTeamId
    ) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'winnerTeamId debe ser uno de los equipos de la serie.',
        HttpStatus.BAD_REQUEST,
        {
          seriesId: series.id,
          winnerTeamId: input.winnerTeamId,
        },
      );
    }

    await this.repo.markSeriesCompleted(series.id, input.winnerTeamId);

    this.events.emit(DomainEvent.PLAYOFF_SERIES_COMPLETED, {
      seriesId: series.id,
      categoryId: series.categoryId,
      winnerTeamId: input.winnerTeamId,
      loserTeamId:
        input.winnerTeamId === series.homeTeamId
          ? series.awayTeamId
          : series.homeTeamId,
    } satisfies DomainEventPayloads['playoff.series.completed']);

    this.logger.log(
      `Series ${series.id} tiebreaker resolved → winner ${input.winnerTeamId} by ${input.resolvedBy}`,
    );

    return this.repo.findSeriesById(series.id);
  }
}
