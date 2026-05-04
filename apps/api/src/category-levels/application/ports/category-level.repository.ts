import { CategoryLevel } from '../../domain/entities/category-level.entity';

export interface CreateCategoryLevelInput {
  sportId: string;
  code: string;
  displayName: string;
  rank: number;
}

export interface UpdateCategoryLevelInput {
  code?: string;
  displayName?: string;
  rank?: number;
}

export const CATEGORY_LEVEL_REPOSITORY = Symbol('ICategoryLevelRepository');

export interface ICategoryLevelRepository {
  findById(id: string): Promise<CategoryLevel | null>;
  findBySportAndCode(
    sportId: string,
    code: string,
  ): Promise<CategoryLevel | null>;
  listBySport(sportId: string): Promise<CategoryLevel[]>;
  create(input: CreateCategoryLevelInput): Promise<CategoryLevel>;
  update(id: string, input: UpdateCategoryLevelInput): Promise<CategoryLevel>;
  delete(id: string): Promise<void>;
  /** Devuelve cuántos equipos tienen este nivel asignado. */
  countTeamsAssigned(id: string): Promise<number>;
  /** Devuelve cuántas categorías de torneo lo referencian. */
  countCategoriesUsing(id: string): Promise<number>;
}
