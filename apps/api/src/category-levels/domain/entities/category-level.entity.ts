import { LevelCode } from '../value-objects/level-code.vo';

/**
 * Entidad de dominio CategoryLevel.
 *
 * Niveles globales por deporte (RN-044). El `rank` define el orden:
 * 1 = más alto, números mayores = niveles inferiores.
 */
export class CategoryLevel {
  constructor(
    public readonly id: string,
    public readonly sportId: string,
    public readonly code: LevelCode,
    public readonly displayName: string,
    public readonly rank: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Comparator: devuelve -1 si this es más alto que other, 0 si iguales, 1 si más bajo.
   * Más alto = rank menor.
   */
  compareRank(other: CategoryLevel): -1 | 0 | 1 {
    if (this.rank < other.rank) return -1;
    if (this.rank > other.rank) return 1;
    return 0;
  }

  isHigherThan(other: CategoryLevel): boolean {
    return this.compareRank(other) === -1;
  }

  isLowerThan(other: CategoryLevel): boolean {
    return this.compareRank(other) === 1;
  }
}
