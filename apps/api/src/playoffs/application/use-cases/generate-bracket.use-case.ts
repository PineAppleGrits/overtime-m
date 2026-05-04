import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CategorySubstatus,
  PlayoffFormat,
  PlayoffSeriesStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { StandingsService } from '../../../fixtures/generators/standings.service';
import {
  BusinessError,
  ErrorCode,
} from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  GAMES_PER_FORMAT,
  QualifiedTeam,
  planBracket,
} from '../../domain/rules/bracket-generation.rules';
import {
  IPlayoffRepository,
  PLAYOFF_REPOSITORY,
} from '../ports/playoff-repository.port';

export interface GenerateBracketInput {
  categoryId: string;
  /** Fecha base para programar el game 1 de cada serie. */
  baseDate?: Date;
}

@Injectable()
export class GenerateBracketUseCase {
  private readonly logger = new Logger(GenerateBracketUseCase.name);

  constructor(
    @Inject(PLAYOFF_REPOSITORY)
    private readonly repo: IPlayoffRepository,
    private readonly prisma: PrismaService,
    private readonly standings: StandingsService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    input: GenerateBracketInput,
  ): Promise<{ seriesIds: string[]; categoryId: string }> {
    const category = await this.prisma.category.findUnique({
      where: { id: input.categoryId, deletedAt: null },
      include: { tournament: true, zones: true },
    });

    if (!category) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Categoría no encontrada',
        HttpStatus.NOT_FOUND,
        { categoryId: input.categoryId },
      );
    }

    const existing = await this.repo.findSeriesByCategory(input.categoryId);
    if (existing.length > 0) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_ALREADY_GENERATED,
        'El bracket ya fue generado para esta categoría.',
        HttpStatus.CONFLICT,
        { categoryId: input.categoryId, existingCount: existing.length },
      );
    }

    // Validar que la regular esté completa
    const { finished, total } = await this.repo.countCompletedRegularMatches(
      input.categoryId,
    );
    if (total === 0 || finished !== total) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_PHASE_NOT_READY,
        `La fase regular no está completa (${finished}/${total} partidos finalizados).`,
        HttpStatus.CONFLICT,
        { categoryId: input.categoryId, finished, total },
      );
    }

    // Calcular standings para extraer clasificados
    const standings = await this.standings.getCategoryStandings(
      input.categoryId,
    );

    const qualifiers: QualifiedTeam[] = [];
    const zonesCount = category.zonesCount;
    const qualifiersPerZone = category.qualifiersPerZone ?? null;
    const qualifierCount = category.qualifierCount ?? null;

    if (zonesCount === 1 && standings.zones.length >= 1) {
      const zone = standings.zones[0];
      const take = qualifierCount ?? zone.teams.length;
      zone.teams.slice(0, take).forEach((t) =>
        qualifiers.push({
          teamId: t.teamId,
          teamName: t.teamName,
          zoneRank: t.position,
          zoneId: zone.zoneId,
        }),
      );
    } else if (zonesCount === 2 && standings.zones.length >= 2) {
      const perZone =
        qualifiersPerZone ??
        Math.floor((qualifierCount ?? 8) / 2);
      for (const zone of standings.zones) {
        zone.teams.slice(0, perZone).forEach((t) =>
          qualifiers.push({
            teamId: t.teamId,
            teamName: t.teamName,
            zoneRank: t.position,
            zoneId: zone.zoneId,
          }),
        );
      }
    } else {
      throw new BusinessError(
        ErrorCode.PLAYOFF_PHASE_NOT_READY,
        'Configuración de zonas inconsistente con los standings.',
        HttpStatus.CONFLICT,
      );
    }

    if (qualifiers.length < 2) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_INSUFFICIENT_TEAMS,
        'No hay clasificados suficientes para generar playoffs.',
        HttpStatus.CONFLICT,
        { qualifiers: qualifiers.length },
      );
    }

    const formatByRound =
      (category.playoffFormatByRound as
        | Record<string, string>
        | null) ?? null;

    // Default fallback format de la sport rules
    const defaultFormat: PlayoffFormat = 'BO3';

    const plans = planBracket({
      qualifiers,
      zonesCount,
      formatByRound: formatByRound as never,
      defaultFormat,
      hasThirdPlaceMatch: category.hasThirdPlaceMatch,
      hasPlayIn: category.hasPlayIn,
    });

    if (plans.length === 0) {
      throw new BusinessError(
        ErrorCode.PLAYOFF_INSUFFICIENT_TEAMS,
        'No fue posible generar el bracket con los datos provistos.',
        HttpStatus.CONFLICT,
      );
    }

    // Crear series en una transacción.
    // Como las "feedsFrom" referencian series que se crean en la misma operación,
    // creamos primero todas las series sin feedsFrom, luego linkeamos.
    const baseDate = input.baseDate ?? new Date();
    const createdSeriesIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      // Mapa: round.bracketPosition (de la ronda anterior) → series.id
      // Lo construimos por ronda en orden de generación.
      const idsByRoundAndPos = new Map<string, string>();

      for (const plan of plans) {
        const series = await tx.playoffSeries.create({
          data: {
            categoryId: input.categoryId,
            round: plan.round,
            bracketPosition: plan.bracketPosition,
            format: plan.format,
            homeTeamId: plan.homeTeamId,
            awayTeamId: plan.awayTeamId,
            status:
              plan.homeTeamId && plan.awayTeamId
                ? PlayoffSeriesStatus.READY
                : PlayoffSeriesStatus.PENDING,
          },
        });
        idsByRoundAndPos.set(`${plan.round}#${plan.bracketPosition}`, series.id);
        createdSeriesIds.push(series.id);
      }

      // Linkear feedsFromSeriesA/B basándose en la ronda anterior.
      // Para Two-zone, semis vienen de QF; final de SF; third_place de SF.
      // Para single-zone: cada ronda alimenta de la inmediata anterior por posición.
      for (const plan of plans) {
        if (plan.feedsFromA === null && plan.feedsFromB === null) continue;
        // Determinar la ronda alimentadora
        let feederRound: string | null = null;
        if (plan.round === 'SEMIFINAL') feederRound = 'QUARTERFINAL';
        else if (plan.round === 'FINAL') feederRound = 'SEMIFINAL';
        else if (plan.round === 'THIRD_PLACE') feederRound = 'SEMIFINAL';
        if (!feederRound) continue;

        const seriesId = idsByRoundAndPos.get(
          `${plan.round}#${plan.bracketPosition}`,
        );
        if (!seriesId) continue;

        const feedAId = plan.feedsFromA
          ? idsByRoundAndPos.get(`${feederRound}#${plan.feedsFromA}`)
          : undefined;
        const feedBId = plan.feedsFromB
          ? idsByRoundAndPos.get(`${feederRound}#${plan.feedsFromB}`)
          : undefined;

        await tx.playoffSeries.update({
          where: { id: seriesId },
          data: {
            feedsFromSeriesAId: feedAId,
            feedsFromSeriesBId: feedBId,
          },
        });
      }

      // Crear Match para series con teams asignados (status READY)
      const matchType = 'playoff';
      const data: Prisma.MatchCreateManyInput[] = [];
      for (const plan of plans) {
        if (!plan.homeTeamId || !plan.awayTeamId) continue;
        const seriesId = idsByRoundAndPos.get(
          `${plan.round}#${plan.bracketPosition}`,
        );
        if (!seriesId) continue;
        const games = GAMES_PER_FORMAT[plan.format];
        for (let g = 1; g <= games; g++) {
          const home = g % 2 === 1 ? plan.homeTeamId : plan.awayTeamId;
          const away = g % 2 === 1 ? plan.awayTeamId : plan.homeTeamId;
          const date = new Date(baseDate);
          date.setUTCDate(date.getUTCDate() + (g - 1) * 3);
          data.push({
            homeTeamId: home,
            awayTeamId: away,
            categoryId: input.categoryId,
            matchDate: date,
            status: 'programado',
            matchType,
            seriesId,
            seriesGameNumber: g,
            playoffStage: plan.round as never,
          });
        }
      }
      if (data.length > 0) {
        await tx.match.createMany({ data });
      }

      // Mover la categoría a PLAYOFFS_FASE si no lo está ya.
      await tx.category.update({
        where: { id: input.categoryId },
        data: { substatus: CategorySubstatus.PLAYOFFS_FASE },
      });
    });

    this.events.emit(DomainEvent.CATEGORY_PLAYOFFS_STARTED, {
      categoryId: input.categoryId,
    } satisfies DomainEventPayloads['category.playoffs.started']);

    this.events.emit(DomainEvent.PLAYOFF_BRACKET_GENERATED, {
      categoryId: input.categoryId,
      seriesIds: createdSeriesIds,
    } satisfies DomainEventPayloads['playoff.bracket.generated']);

    this.logger.log(
      `Bracket generado para categoría ${input.categoryId}: ${createdSeriesIds.length} series, ${plans.length} planificadas`,
    );

    return { seriesIds: createdSeriesIds, categoryId: input.categoryId };
  }
}
