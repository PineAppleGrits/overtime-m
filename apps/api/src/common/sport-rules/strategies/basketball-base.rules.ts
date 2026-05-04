import { PlayoffFormat } from '@prisma/client';
import {
  PlayoffRules,
  ScoringRules,
  SportCode,
  StaffRules,
} from '../sport-rules.types';

/**
 * Reglas comunes a todas las modalidades de básquet (FIBA).
 * Las modalidades 5v5 / 3v3 difieren solo en roster — todo lo demás es FIBA estándar.
 */
export const BASKETBALL_SPORT_CODE: SportCode = 'BASKETBALL';

/**
 * RN-024 + scoring FIBA confirmado por el usuario:
 * - 2 puntos por victoria.
 * - 1 punto por derrota (FIBA).
 * - 0 puntos por no presentación.
 * - Empate no existe orgánicamente; un 0-0 administrativo (RN-056) NO suma.
 */
export const BASKETBALL_SCORING: ScoringRules = {
  win: 2,
  loss: 1,
  noShow: 0,
  draw: 0,
};

/** RN-049 — staff mínimo idéntico para 5v5 y 3v3. */
export const BASKETBALL_STAFF: StaffRules = {
  minReferees: 1,
  minTableOfficials: 1,
  idealReferees: 2,
  idealTableOfficials: 2,
};

/**
 * Defaults sugeridos de playoff format por ronda. DP-001 todavía abierto;
 * estos valores son razonables para básquet y editables por admin.
 */
export const BASKETBALL_PLAYOFF: PlayoffRules = {
  defaultFormatByRound: {
    quarterfinal: PlayoffFormat.BO1,
    semifinal: PlayoffFormat.BO3,
    final: PlayoffFormat.BO5,
    thirdPlace: PlayoffFormat.BO1,
    playIn: PlayoffFormat.BO1,
  },
};

/**
 * Validación de marcador para básquet (FIBA).
 * - No se permiten valores negativos.
 * - 0-0 está permitido SOLO como marcador administrativo (RN-056 cancelación
 *   mutua); cualquier otro marcador con un equipo en 0 también es válido.
 *
 * No validamos un mínimo total porque puede haber finales atípicos
 * (ej. partidos cortos en 3v3 o suspensiones).
 */
export function basketballValidateScore(
  home: number,
  away: number,
): string | null {
  if (!Number.isInteger(home) || !Number.isInteger(away)) {
    return 'El marcador debe ser un número entero';
  }
  if (home < 0 || away < 0) {
    return 'El marcador no puede ser negativo';
  }
  return null;
}

/** RN-024 — un 0-0 nunca suma para ninguno de los dos equipos. */
export function basketballScoreCountsForStandings(
  home: number,
  away: number,
): boolean {
  return !(home === 0 && away === 0);
}
