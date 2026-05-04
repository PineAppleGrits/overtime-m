import { Injectable, NotFoundException } from '@nestjs/common';
import { PlayoffFormat } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { SportRulesRegistry } from '../../../../common/sport-rules/sport-rules.registry';
import {
  Modality,
  SportCode,
} from '../../../../common/sport-rules/sport-rules.types';
import {
  mergePlayoffFormatWithDefaults,
  PlayoffFormatByRound,
  PlayoffRoundKey,
} from '../../domain/rules/playoff-config.rules';

export interface GetPlayoffConfigOutput {
  categoryId: string;
  zonesCount: number;
  qualifierCount: number | null;
  qualifiersPerZone: number | null;
  hasPlayIn: boolean;
  hasThirdPlaceMatch: boolean;
  /** Configuración persistida (si la hay). */
  playoffFormatByRound: PlayoffFormatByRound | null;
  /** Default sugerido por la strategy del deporte/modalidad. */
  defaultFormatByRound: Record<PlayoffRoundKey, PlayoffFormat>;
  /** Merge: persistido + defaults en las rondas faltantes. */
  effectiveFormatByRound: Record<PlayoffRoundKey, PlayoffFormat>;
}

/**
 * GET /api/v1/tournaments/:tournamentId/categories/:id/playoff-config
 *
 * Devuelve la configuración de playoffs persistida + el default sugerido
 * por la strategy del deporte/modalidad. El FE puede mostrar el "efectivo"
 * (merge) y dejar al admin reescribir solo lo que cambia.
 */
@Injectable()
export class GetPlayoffConfigUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sportRules: SportRulesRegistry,
  ) {}

  async execute(categoryId: string): Promise<GetPlayoffConfigOutput> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      include: {
        tournament: { select: { sportId: true, modality: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // TODO(W1.1): cuando los torneos tengan modalidad estable y un sport.code
    // canónico, mapear `category.tournament.sport.code` → `SportCode`.
    // Por ahora asumimos básquet 5v5 si no viene modalidad seteada.
    const sportCode: SportCode = 'BASKETBALL';
    const modality: Modality =
      (category.tournament.modality as Modality | null) ?? '5v5';
    const rules = this.sportRules.tryGet(sportCode, modality);
    const defaults =
      rules?.playoff.defaultFormatByRound ??
      this.sportRules.get(sportCode, '5v5').playoff.defaultFormatByRound;

    const persisted = (category.playoffFormatByRound ?? null) as
      | PlayoffFormatByRound
      | null;

    return {
      categoryId: category.id,
      zonesCount: category.zonesCount,
      qualifierCount: category.qualifierCount,
      qualifiersPerZone: category.qualifiersPerZone,
      hasPlayIn: category.hasPlayIn,
      hasThirdPlaceMatch: category.hasThirdPlaceMatch,
      playoffFormatByRound: persisted,
      defaultFormatByRound: defaults,
      effectiveFormatByRound: mergePlayoffFormatWithDefaults(persisted, defaults),
    };
  }
}
