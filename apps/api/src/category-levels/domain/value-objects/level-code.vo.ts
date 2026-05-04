/**
 * Value object para el código de nivel de categoría (RN-044, RN-058).
 *
 * Reglas:
 * - Alfanumérico en mayúsculas (A, B, C, A1, B2...).
 * - 1-8 caracteres.
 * - Inmutable: la igualdad se basa en el valor, no la referencia.
 */
export class LevelCode {
  private static readonly PATTERN = /^[A-Z0-9]+$/;
  private static readonly MAX_LENGTH = 8;

  private constructor(public readonly value: string) {}

  static create(raw: string): LevelCode {
    const trimmed = raw?.trim();
    if (!trimmed) {
      throw new Error('El código de nivel es obligatorio');
    }
    if (trimmed.length > LevelCode.MAX_LENGTH) {
      throw new Error(
        `El código de nivel supera el largo máximo (${LevelCode.MAX_LENGTH})`,
      );
    }
    if (!LevelCode.PATTERN.test(trimmed)) {
      throw new Error(
        'El código de nivel debe ser alfanumérico en mayúsculas (A, B, C, A1, ...)',
      );
    }
    return new LevelCode(trimmed);
  }

  equals(other: LevelCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
