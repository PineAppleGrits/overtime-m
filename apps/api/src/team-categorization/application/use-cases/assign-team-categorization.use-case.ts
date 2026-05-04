import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  DomainEvent,
  DomainEventPayloads,
} from '../../../common/events/domain-events';
import { PrismaService } from '../../../database/prisma.service';
import {
  CATEGORY_LEVEL_REPOSITORY,
  ICategoryLevelRepository,
} from '../../../category-levels/application/ports/category-level.repository';
import {
  canAddLevelsWithoutReplacing,
  MAX_LEVELS_PER_TEAM,
  validateProposedLevelCodes,
} from '../../domain/rules/team-categorization.rules';
import { TeamCategoryLevel } from '../../domain/entities/team-category-level.entity';
import {
  AssignTeamLevelInput,
  ITeamCategoryLevelRepository,
  TEAM_CATEGORY_LEVEL_REPOSITORY,
} from '../ports/team-category-level.repository';

export interface AssignTeamCategorizationCommand {
  teamId: string;
  levelCodes: string[];
  notes?: string;
  grantedByProfileId: string;
  /** Si es true reemplaza los niveles existentes; si false los agrega (RN-044). */
  replace: boolean;
}

@Injectable()
export class AssignTeamCategorizationUseCase {
  constructor(
    @Inject(TEAM_CATEGORY_LEVEL_REPOSITORY)
    private readonly teamLevelsRepo: ITeamCategoryLevelRepository,
    @Inject(CATEGORY_LEVEL_REPOSITORY)
    private readonly categoryLevelsRepo: ICategoryLevelRepository,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    cmd: AssignTeamCategorizationCommand,
  ): Promise<TeamCategoryLevel[]> {
    const validationError = validateProposedLevelCodes(cmd.levelCodes);
    if (validationError) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        validationError,
        HttpStatus.BAD_REQUEST,
      );
    }

    const team = await this.prisma.team.findUnique({
      where: { id: cmd.teamId, deletedAt: null },
      select: { id: true, sportId: true },
    });
    if (!team) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Equipo no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    // Resolver levelCodes → CategoryLevel del deporte del equipo
    const resolved = await Promise.all(
      cmd.levelCodes.map(async (code) => {
        const lvl = await this.categoryLevelsRepo.findBySportAndCode(
          team.sportId,
          code,
        );
        if (!lvl) {
          throw new BusinessError(
            ErrorCode.NOT_FOUND,
            `Nivel "${code}" no existe para este deporte`,
            HttpStatus.NOT_FOUND,
            { code, sportId: team.sportId },
          );
        }
        return lvl;
      }),
    );

    const inputs: AssignTeamLevelInput[] = resolved.map((lvl) => ({
      teamId: cmd.teamId,
      categoryLevelId: lvl.id,
      grantedByProfileId: cmd.grantedByProfileId,
      notes: cmd.notes ?? null,
    }));

    let result: TeamCategoryLevel[];
    if (cmd.replace) {
      result = await this.teamLevelsRepo.replaceForTeam(cmd.teamId, inputs);
    } else {
      const current = await this.teamLevelsRepo.listByTeam(cmd.teamId);
      // Filtrar los que ya tiene (idempotencia)
      const newOnes = inputs.filter(
        (i) => !current.some((c) => c.categoryLevelId === i.categoryLevelId),
      );
      if (!canAddLevelsWithoutReplacing(current.length, newOnes.length)) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          `Un equipo puede tener hasta ${MAX_LEVELS_PER_TEAM} niveles (RN-044)`,
          HttpStatus.BAD_REQUEST,
          {
            currentLevels: current.length,
            attemptedToAdd: newOnes.length,
            max: MAX_LEVELS_PER_TEAM,
          },
        );
      }
      const added = await this.teamLevelsRepo.addForTeam(newOnes);
      result = [...current, ...added];
    }

    if (result.length > 0) {
      this.events.emit(DomainEvent.TEAM_CATEGORIZED, {
        teamId: cmd.teamId,
        categoryLevelIds: result.map((r) => r.categoryLevelId),
        grantedBy: cmd.grantedByProfileId,
      } satisfies DomainEventPayloads['team.categorized']);
    }

    return result;
  }
}
