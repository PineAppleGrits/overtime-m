import { CategoryLevelDto } from '@overtime-mono/shared';
import { CategoryLevel } from '../../domain/entities/category-level.entity';

export function toCategoryLevelDto(level: CategoryLevel): CategoryLevelDto {
  return {
    id: level.id,
    sportId: level.sportId,
    code: level.code.value,
    displayName: level.displayName,
    rank: level.rank,
    createdAt: level.createdAt.toISOString(),
    updatedAt: level.updatedAt.toISOString(),
  };
}
