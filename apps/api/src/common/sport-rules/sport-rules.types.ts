/**
 * Códigos de deporte y modalidad soportados.
 *
 * Decisión PR0 (modelado β): un único Sport = BASKETBALL + dimension `modality`.
 * La strategy se resuelve por la tupla (sportCode, modality).
 */
export const SPORT_CODES = ['BASKETBALL'] as const;
export type SportCode = (typeof SPORT_CODES)[number];

export const BASKETBALL_MODALITIES = ['5v5', '3v3'] as const;
export type BasketballModality = (typeof BASKETBALL_MODALITIES)[number];

export type Modality = BasketballModality;

export interface ScoringRules {
  /** Puntos de tabla por victoria. */
  win: number;
  /** Puntos de tabla por derrota (FIBA: 1). */
  loss: number;
  /** Puntos de tabla por no presentación. */
  noShow: number;
  /** Puntos de tabla por empate. En FIBA basket no aplica (siempre hay ganador). */
  draw: number;
}

export interface RosterRules {
  /** Mínimo de jugadores en la lista de buena fe (RN-009). */
  rosterMin: number;
  /** Máximo de jugadores en la lista de buena fe. */
  rosterMax: number;
  /** Jugadores en cancha simultáneos (5 en 5v5, 3 en 3v3). */
  playersOnCourt: number;
  /** Mínimo de jugadores presentes para que el partido pueda jugarse. */
  minPlayersToStart: number;
}

export interface StaffRules {
  /** Mínimo absoluto de árbitros para habilitar el partido (RN-049). */
  minReferees: number;
  /** Mínimo absoluto de oficiales de mesa para habilitar el partido (RN-049). */
  minTableOfficials: number;
  /** Configuración ideal (no bloqueante). */
  idealReferees: number;
  idealTableOfficials: number;
}

import { PlayoffFormat } from '@prisma/client';

export interface PlayoffRules {
  /** Default sugerido para nuevas categorías. Editable por admin. */
  defaultFormatByRound: {
    quarterfinal: PlayoffFormat;
    semifinal: PlayoffFormat;
    final: PlayoffFormat;
    thirdPlace: PlayoffFormat;
    playIn: PlayoffFormat;
  };
}

/**
 * Strategy de reglas de un deporte+modalidad.
 *
 * Implementaciones viven en `strategies/`. Se registran en `SportRulesRegistry`.
 * Los valores son hardcoded por ahora; cuando aparezca la necesidad, se sobreescriben
 * con `SportRulesConfig` desde DB sin romper la interfaz (decisión híbrida).
 */
export interface SportRules {
  readonly sportCode: SportCode;
  readonly modality: Modality;
  readonly key: string; // `${sportCode}_${modality}`
  readonly scoring: ScoringRules;
  readonly roster: RosterRules;
  readonly staff: StaffRules;
  readonly playoff: PlayoffRules;

  /**
   * Valida un marcador de partido finalizado.
   * Retorna `null` si es válido; si no, retorna un mensaje de error.
   */
  validateScore(home: number, away: number): string | null;

  /**
   * Indica si un marcador suma puntos de tabla (RN-024 — 0-0 administrativo
   * en básquet no suma para ningún equipo).
   */
  scoreCountsForStandings(home: number, away: number): boolean;
}
