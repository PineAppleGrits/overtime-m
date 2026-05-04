import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CategoryStatus,
  PlayoffFormat,
  PlayoffSeriesStatus,
  Prisma,
} from '@prisma/client';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { GAMES_PER_FORMAT } from '../../domain/rules/bracket-generation.rules';
import { PrismaService } from '../../../database/prisma.service';
import { StandingsService } from '../../../fixtures/generators/standings.service';

export interface GeneratePromotionPlayoffInput {
  /** Categoría inferior (cuyo campeón asciende). */
  lowerCategoryId: string;
}

/**
 * RN-058 — Repechaje entre el último de la categoría superior y el 2° de
 * la categoría inferior.
 *
 * Pre-condición: el torneo entero (todas sus categorías) debe estar en
 * `FINISHED`. La generación es manual (acción admin) — TODO: DP-005 sobre
 * el momento exacto.
 *
 * Edge cases:
 *  - Si no existe categoría superior (ya estamos en el nivel más alto),
 *    no genera nada y loguea info.
 *  - Si la inferior no tiene 2 equipos, no se puede generar.
 */
@Injectable()
export class GeneratePromotionPlayoffUseCase {
  private readonly logger = new Logger(GeneratePromotionPlayoffUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly standings: StandingsService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    input: GeneratePromotionPlayoffInput,
  ): Promise<{ generated: boolean; seriesId?: string; reason?: string }> {
    const lower = await this.prisma.category.findUnique({
      where: { id: input.lowerCategoryId, deletedAt: null },
      include: {
        tournament: true,
        categoryLevel: true,
      },
    });

    if (!lower) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Categoría inferior no encontrada',
        HttpStatus.NOT_FOUND,
        { categoryId: input.lowerCategoryId },
      );
    }

    if (lower.status !== CategoryStatus.FINISHED) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_PROMOTION_NOT_READY,
        `La categoría inferior debe estar FINISHED (actual: ${lower.status}).`,
        HttpStatus.CONFLICT,
        { categoryId: input.lowerCategoryId, status: lower.status },
      );
    }

    if (!lower.categoryLevel) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_PROMOTION_NOT_READY,
        'La categoría inferior no tiene nivel asignado.',
        HttpStatus.CONFLICT,
      );
    }

    // Buscar la categoría superior dentro del mismo torneo y mismo deporte:
    // categoryLevel con rank = lower.rank - 1 (mejor)
    const upper = await this.prisma.category.findFirst({
      where: {
        tournamentId: lower.tournamentId,
        deletedAt: null,
        categoryLevel: {
          sportId: lower.categoryLevel.sportId,
          rank: lower.categoryLevel.rank - 1,
        },
      },
      include: { categoryLevel: true },
    });

    if (!upper) {
      this.logger.log(
        `No existe categoría superior a "${lower.name}" — el campeón se mantiene (RN-058).`,
      );
      return {
        generated: false,
        reason: 'No upper category — champion stays in same level',
      };
    }

    if (upper.status !== CategoryStatus.FINISHED) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_PROMOTION_NOT_READY,
        `La categoría superior debe estar FINISHED (actual: ${upper.status}).`,
        HttpStatus.CONFLICT,
        { upperCategoryId: upper.id, status: upper.status },
      );
    }

    // Lower: necesitamos el 2° general; Upper: el último.
    const lowerStandings = await this.standings.getCategoryStandings(lower.id);
    const upperStandings = await this.standings.getCategoryStandings(upper.id);

    const lowerSecond = lowerStandings.overallStandings[1];
    const upperLast =
      upperStandings.overallStandings[
        upperStandings.overallStandings.length - 1
      ];

    if (!lowerSecond) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_INSUFFICIENT_TEAMS,
        'La categoría inferior no tiene 2° clasificado.',
        HttpStatus.CONFLICT,
      );
    }
    if (!upperLast) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_INSUFFICIENT_TEAMS,
        'La categoría superior no tiene último clasificado.',
        HttpStatus.CONFLICT,
      );
    }

    // Crear PlayoffSeries de PROMOTION_PLAYOFF en la categoría inferior
    const format: PlayoffFormat =
      (lower.tournament.promotionPlayoffFormat as PlayoffFormat) ?? 'BO1';

    const series = await this.prisma.playoffSeries.create({
      data: {
        categoryId: lower.id,
        round: 'PROMOTION_PLAYOFF',
        bracketPosition: 1,
        format,
        homeTeamId: upperLast.teamId,
        awayTeamId: lowerSecond.teamId,
        status: PlayoffSeriesStatus.READY,
      },
    });

    // Crear los matches físicos
    const games = GAMES_PER_FORMAT[format];
    const baseDate = new Date();
    baseDate.setUTCDate(baseDate.getUTCDate() + 7);
    const data: Prisma.MatchCreateManyInput[] = [];
    for (let g = 1; g <= games; g++) {
      const home = g % 2 === 1 ? upperLast.teamId : lowerSecond.teamId;
      const away = g % 2 === 1 ? lowerSecond.teamId : upperLast.teamId;
      const date = new Date(baseDate);
      date.setUTCDate(date.getUTCDate() + (g - 1) * 3);
      data.push({
        homeTeamId: home,
        awayTeamId: away,
        categoryId: lower.id,
        matchDate: date,
        status: 'programado',
        matchType: 'promotion_playoff',
        seriesId: series.id,
        seriesGameNumber: g,
        playoffStage: 'PROMOTION_PLAYOFF' as never,
      });
    }
    await this.prisma.match.createMany({ data });

    this.events.emit(DomainEvent.PLAYOFF_PROMOTION_GENERATED, {
      seriesId: series.id,
      upperCategoryId: upper.id,
      lowerCategoryId: lower.id,
      upperTeamId: upperLast.teamId,
      lowerTeamId: lowerSecond.teamId,
    } satisfies DomainEventPayloads['playoff.promotion.generated']);

    this.logger.log(
      `Promotion playoff series ${series.id} generated: ${upperLast.teamName} (último ${upper.name}) vs ${lowerSecond.teamName} (2° ${lower.name})`,
    );

    // TODO: DP-005 — definir formato/momento exactos del repechaje. Por
    // ahora se ejecuta on-demand y respeta `Tournament.promotionPlayoffFormat`.

    return { generated: true, seriesId: series.id };
  }
}
