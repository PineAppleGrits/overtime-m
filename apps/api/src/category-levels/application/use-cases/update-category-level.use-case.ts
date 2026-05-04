import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { CategoryLevel } from '../../domain/entities/category-level.entity';
import { LevelCode } from '../../domain/value-objects/level-code.vo';
import {
  CATEGORY_LEVEL_REPOSITORY,
  ICategoryLevelRepository,
} from '../ports/category-level.repository';

export interface UpdateCategoryLevelCommand {
  id: string;
  code?: string;
  displayName?: string;
  rank?: number;
}

@Injectable()
export class UpdateCategoryLevelUseCase {
  constructor(
    @Inject(CATEGORY_LEVEL_REPOSITORY)
    private readonly repo: ICategoryLevelRepository,
  ) {}

  async execute(cmd: UpdateCategoryLevelCommand): Promise<CategoryLevel> {
    const current = await this.repo.findById(cmd.id);
    if (!current) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Nivel de categoría no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    let normalizedCode: string | undefined;
    if (cmd.code !== undefined) {
      normalizedCode = LevelCode.create(cmd.code).value;
      if (normalizedCode !== current.code.value) {
        const conflict = await this.repo.findBySportAndCode(
          current.sportId,
          normalizedCode,
        );
        if (conflict && conflict.id !== current.id) {
          throw new BusinessError(
            ErrorCode.CONFLICT,
            `Ya existe un nivel con código "${normalizedCode}" para este deporte`,
            HttpStatus.CONFLICT,
            { sportId: current.sportId, code: normalizedCode },
          );
        }
      }
    }

    return this.repo.update(cmd.id, {
      code: normalizedCode,
      displayName: cmd.displayName?.trim(),
      rank: cmd.rank,
    });
  }
}
