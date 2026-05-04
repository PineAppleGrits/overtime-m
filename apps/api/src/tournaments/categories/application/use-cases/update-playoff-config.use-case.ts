import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessError, ErrorCode } from '../../../../common/errors';
import {
  isPlayoffConfigEditable,
  validatePlayoffFormatJson,
  validateZonesCount,
} from '../../domain/rules/playoff-config.rules';
import { UpdatePlayoffConfigInput } from '../../presentation/dto/playoff-config.schema';
import { GetPlayoffConfigOutput, GetPlayoffConfigUseCase } from './get-playoff-config.use-case';

/**
 * PATCH /api/v1/tournaments/:tournamentId/categories/:id/playoff-config
 *
 * Editar config de playoffs:
 * - RN-047 — solo se puede editar mientras `substatus !== PLAYOFFS_FASE`.
 * - DP-003 — `zonesCount` ∈ {1, 2}.
 * - JSON `playoffFormatByRound` validado por schema (Zod en el controller)
 *   y por la regla pura.
 */
@Injectable()
export class UpdatePlayoffConfigUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getConfig: GetPlayoffConfigUseCase,
  ) {}

  async execute(
    categoryId: string,
    input: UpdatePlayoffConfigInput,
  ): Promise<GetPlayoffConfigOutput> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      select: { id: true, substatus: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // RN-047 — no editar si los playoffs ya empezaron.
    if (!isPlayoffConfigEditable(category.substatus)) {
      throw new BusinessError(
        ErrorCode.CATEGORY_PLAYOFF_FORMAT_LOCKED,
        'No se puede editar la configuración de playoffs porque la categoría ya está en fase de playoffs.',
        HttpStatus.CONFLICT,
        { categoryId },
      );
    }

    // DP-003 — validar zonesCount.
    if (input.zonesCount !== undefined) {
      const err = validateZonesCount(input.zonesCount);
      if (err) {
        throw new BusinessError(
          ErrorCode.CATEGORY_TOO_MANY_ZONES,
          err,
          HttpStatus.BAD_REQUEST,
          { categoryId, zonesCount: input.zonesCount },
        );
      }
    }

    // RN-047 — validar el JSON.
    if (input.playoffFormatByRound !== undefined) {
      const err = validatePlayoffFormatJson(input.playoffFormatByRound);
      if (err) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          err,
          HttpStatus.BAD_REQUEST,
          { categoryId },
        );
      }
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (input.zonesCount !== undefined) data.zonesCount = input.zonesCount;
    if (input.qualifierCount !== undefined)
      data.qualifierCount = input.qualifierCount;
    if (input.qualifiersPerZone !== undefined)
      data.qualifiersPerZone = input.qualifiersPerZone;
    if (input.hasPlayIn !== undefined) data.hasPlayIn = input.hasPlayIn;
    if (input.hasThirdPlaceMatch !== undefined)
      data.hasThirdPlaceMatch = input.hasThirdPlaceMatch;
    if (input.playoffFormatByRound !== undefined) {
      data.playoffFormatByRound =
        input.playoffFormatByRound === null
          ? Prisma.JsonNull
          : (input.playoffFormatByRound as Prisma.InputJsonValue);
    }

    await this.prisma.category.update({ where: { id: categoryId }, data });

    return this.getConfig.execute(categoryId);
  }
}
