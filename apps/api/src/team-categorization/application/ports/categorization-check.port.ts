/**
 * Puerto consumido por otras features (W2.2 Registrations) para validar
 * que un equipo puede inscribirse a una categoría dada (RN-039, RN-044).
 *
 * Implementación: `CategorizationCheckService`.
 */

export const CATEGORIZATION_CHECK_PORT = Symbol('ICategorizationCheckPort');

export interface CategorizationCheckResult {
  canRegister: boolean;
  reason?:
    | 'TEAM_NOT_CATEGORIZED' // RN-039
    | 'TEAM_NOT_ELIGIBLE_FOR_CATEGORY'; // RN-044
  /** Niveles actuales del equipo. */
  teamLevelIds: string[];
  /** Nivel objetivo de la categoría (si está configurado). */
  targetCategoryLevelId: string | null;
}

export interface ICategorizationCheckPort {
  /**
   * Devuelve un resultado granular sin lanzar excepción.
   * Quien consume decide si lanza `BusinessError` o tolera el bloqueo.
   */
  check(
    teamId: string,
    categoryId: string,
  ): Promise<CategorizationCheckResult>;

  /**
   * Variante "imperativa": lanza `BusinessError` con el código adecuado
   * si el equipo no puede inscribirse.
   */
  assertCanRegisterToCategory(
    teamId: string,
    categoryId: string,
  ): Promise<void>;
}
