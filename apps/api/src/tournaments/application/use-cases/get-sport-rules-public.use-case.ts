import { HttpStatus, Injectable } from '@nestjs/common';
import { SportRulesPublic } from '@overtime-mono/shared';
import { PrismaService } from '../../../database/prisma.service';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import {
  Modality,
  SportCode,
  SportRules,
} from '../../../common/sport-rules/sport-rules.types';

export interface GetSportRulesPublicInput {
  /** ID o code del deporte. */
  sportIdOrCode: string;
  /** Modalidad (ej '5v5'). Si se omite, se devuelven todas las modalidades soportadas. */
  modality?: string;
}

export type SportRulesPublicResult = SportRulesPublic | SportRulesPublic[];

/**
 * Devuelve la vista pública (`SportRulesPublic`) de las reglas de un deporte
 * + modalidad. Sirve para que el FE muestre rosters/scoring/staff sin
 * hardcodearlos.
 *
 * - Si recibe sólo `sportIdOrCode`: devuelve un array con todas las modalidades.
 * - Si recibe `modality`: devuelve la entrada única o falla con
 *   `TOURNAMENT_INVALID_MODALITY`.
 */
@Injectable()
export class GetSportRulesPublicUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: SportRulesRegistry,
  ) {}

  async execute(
    input: GetSportRulesPublicInput,
  ): Promise<SportRulesPublicResult> {
    // Resolver el sport para obtener el `code` (los registry keys son por code).
    const sport = await this.resolveSport(input.sportIdOrCode);
    if (!sport) {
      throw new BusinessError(
        ErrorCode.SPORT_RULES_NOT_FOUND,
        `Deporte ${input.sportIdOrCode} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (input.modality) {
      const rules = this.registry.tryGet(
        sport.code as SportCode,
        input.modality as Modality,
      );
      if (!rules) {
        throw new BusinessError(
          ErrorCode.TOURNAMENT_INVALID_MODALITY,
          `La modalidad "${input.modality}" no está soportada para "${sport.code}".`,
          HttpStatus.BAD_REQUEST,
          { sportCode: sport.code, modality: input.modality },
        );
      }
      return toPublic(rules);
    }

    return this.registry
      .list()
      .filter((r) => r.sportCode === sport.code)
      .map(toPublic);
  }

  private async resolveSport(
    sportIdOrCode: string,
  ): Promise<{ id: string; code: string } | null> {
    // Intentar por id (UUID)
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        sportIdOrCode,
      );
    if (isUuid) {
      const byId = await this.prisma.sport.findUnique({
        where: { id: sportIdOrCode },
        select: { id: true, code: true },
      });
      if (byId) return byId;
    }
    return this.prisma.sport.findUnique({
      where: { code: sportIdOrCode.toUpperCase() },
      select: { id: true, code: true },
    });
  }
}

export function toPublic(rules: SportRules): SportRulesPublic {
  return {
    sportCode: rules.sportCode,
    modality: rules.modality,
    key: rules.key,
    scoring: { ...rules.scoring },
    roster: { ...rules.roster },
    staff: { ...rules.staff },
  };
}
