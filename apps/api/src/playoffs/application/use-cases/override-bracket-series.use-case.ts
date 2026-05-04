import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PlayoffSeriesStatus } from '@prisma/client';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import {
  IPlayoffRepository,
  PLAYOFF_REPOSITORY,
} from '../ports/playoff-repository.port';
import { PrismaService } from '../../../database/prisma.service';

export interface OverrideBracketSeriesInput {
  seriesId: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
}

/**
 * Permite al admin reasignar manualmente equipos en una serie del bracket
 * antes de que arranque la fase de playoffs (no hay matches en curso/finalizados).
 */
@Injectable()
export class OverrideBracketSeriesUseCase {
  constructor(
    @Inject(PLAYOFF_REPOSITORY)
    private readonly repo: IPlayoffRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: OverrideBracketSeriesInput) {
    const series = await this.repo.findSeriesById(input.seriesId);
    if (!series) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Serie no encontrada',
        HttpStatus.NOT_FOUND,
        { seriesId: input.seriesId },
      );
    }

    const started = await this.repo.hasPlayoffMatchesStarted(series.categoryId);
    if (started) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_OVERRIDE_LOCKED,
        'Los playoffs ya iniciaron, no se puede modificar manualmente.',
        HttpStatus.CONFLICT,
        { categoryId: series.categoryId, seriesId: series.id },
      );
    }

    const newHome =
      input.homeTeamId === undefined ? series.homeTeamId : input.homeTeamId;
    const newAway =
      input.awayTeamId === undefined ? series.awayTeamId : input.awayTeamId;

    if (newHome && newAway && newHome === newAway) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'home y away no pueden ser el mismo equipo.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const status =
      newHome && newAway
        ? PlayoffSeriesStatus.READY
        : PlayoffSeriesStatus.PENDING;

    await this.repo.assignTeams(series.id, newHome, newAway, status);

    // Actualizar matches existentes (sólo programados)
    if (newHome && newAway) {
      const matches = await this.prisma.match.findMany({
        where: { seriesId: series.id, status: 'programado', deletedAt: null },
        orderBy: { seriesGameNumber: 'asc' },
      });
      for (const m of matches) {
        const g = m.seriesGameNumber ?? 1;
        const home = g % 2 === 1 ? newHome : newAway;
        const away = g % 2 === 1 ? newAway : newHome;
        await this.prisma.match.update({
          where: { id: m.id },
          data: { homeTeamId: home, awayTeamId: away },
        });
      }
    }

    return this.repo.findSeriesById(series.id);
  }
}
