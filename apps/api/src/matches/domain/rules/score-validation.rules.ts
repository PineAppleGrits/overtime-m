import { SportRules } from '../../../common/sport-rules/sport-rules.types';

/**
 * Resultado de validar un score sobre las reglas del deporte/modalidad.
 */
export interface ScoreValidationResult {
  ok: boolean;
  /** Si !ok, mensaje legible del error de validación. */
  error?: string;
  /** Si ok, indica si el resultado suma puntos a la tabla (RN-024). */
  countsForStandings: boolean;
}

/**
 * Aplica `validateScore` y `scoreCountsForStandings` de la strategy del
 * deporte. Centralizado para que los use-cases no toquen la registry.
 */
export function validateMatchScore(
  rules: SportRules,
  homeScore: number,
  awayScore: number,
): ScoreValidationResult {
  const error = rules.validateScore(homeScore, awayScore);
  if (error) {
    return { ok: false, error, countsForStandings: false };
  }
  return {
    ok: true,
    countsForStandings: rules.scoreCountsForStandings(homeScore, awayScore),
  };
}
