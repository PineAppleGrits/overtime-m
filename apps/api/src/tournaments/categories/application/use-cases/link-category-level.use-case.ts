import {
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessError, ErrorCode } from '../../../../common/errors';
import { validateCategoryLevelSportMatches } from '../../domain/rules/category-level.rules';

/**
 * Caso de uso reusable: validar que un `CategoryLevel` puede vincularse
 * a una `Category` (mismo deporte que el torneo padre — RN-044).
 *
 * Se usa al crear y al editar la categoría. NO escribe a la DB; solo lanza
 * excepciones si la validación falla.
 *
 * TODO(W1.3): cuando `CategoryLevel` se popule completo (CRUD del worktree
 * `feat/api/teams-categorization`), agregar validaciones extra como
 * "el level está activo" o "el rank no se solapa con otro level del torneo".
 */
@Injectable()
export class LinkCategoryLevelUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: {
    categoryLevelId: string;
    tournamentId: string;
  }): Promise<void> {
    const [tournament, level] = await Promise.all([
      this.prisma.tournament.findUnique({
        where: { id: input.tournamentId, deletedAt: null },
        select: { id: true, sportId: true },
      }),
      this.prisma.categoryLevel.findUnique({
        where: { id: input.categoryLevelId },
        select: { id: true, sportId: true },
      }),
    ]);

    if (!tournament) {
      throw new NotFoundException(
        `Tournament ${input.tournamentId} not found`,
      );
    }
    if (!level) {
      throw new NotFoundException(
        `CategoryLevel ${input.categoryLevelId} not found`,
      );
    }

    const err = validateCategoryLevelSportMatches(level, tournament);
    if (err) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        err,
        HttpStatus.BAD_REQUEST,
        {
          categoryLevelId: input.categoryLevelId,
          tournamentId: input.tournamentId,
        },
      );
    }
  }
}
