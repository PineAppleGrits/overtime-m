import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { PrismaService } from '../../../database/prisma.service';
import { CategoryLevel } from '../../domain/entities/category-level.entity';
import { LevelCode } from '../../domain/value-objects/level-code.vo';
import {
  CATEGORY_LEVEL_REPOSITORY,
  ICategoryLevelRepository,
} from '../ports/category-level.repository';

export interface CreateCategoryLevelCommand {
  sportId: string;
  code: string;
  displayName: string;
  rank: number;
}

@Injectable()
export class CreateCategoryLevelUseCase {
  constructor(
    @Inject(CATEGORY_LEVEL_REPOSITORY)
    private readonly repo: ICategoryLevelRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(cmd: CreateCategoryLevelCommand): Promise<CategoryLevel> {
    // Validación VO (formato de código)
    const code = LevelCode.create(cmd.code);

    // Validar deporte
    const sport = await this.prisma.sport.findUnique({
      where: { id: cmd.sportId },
      select: { id: true },
    });
    if (!sport) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Deporte no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    // Unicidad por (sportId, code)
    const existing = await this.repo.findBySportAndCode(
      cmd.sportId,
      code.value,
    );
    if (existing) {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        `Ya existe un nivel con código "${code.value}" para este deporte`,
        HttpStatus.CONFLICT,
        { sportId: cmd.sportId, code: code.value },
      );
    }

    return this.repo.create({
      sportId: cmd.sportId,
      code: code.value,
      displayName: cmd.displayName.trim(),
      rank: cmd.rank,
    });
  }
}
