import { PlayoffFormat } from '@prisma/client';
import { WINS_TO_CLINCH } from './bracket-generation.rules';

export interface SeriesGameOutcome {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  /** True si fue 0-0 administrativo (RN-024) — no determina ganador. */
  countsForStandings: boolean;
  status: string;
}

export interface SeriesProgress {
  homeWins: number;
  awayWins: number;
  /** True si la serie tiene ganador definido por wins-to-clinch. */
  isCompleted: boolean;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  /** Si terminó en 0-0 BO1 (administrativo), winner queda undefined → tiebreaker manual. */
  needsTiebreaker: boolean;
}

/**
 * Calcula progreso de una serie a partir de los matches finalizados.
 *
 * - Wins solo se cuentan si `countsForStandings=true` (RN-024 — un 0-0
 *   administrativo NO da ganador).
 * - Cuando los wins de un equipo alcanzan `WINS_TO_CLINCH[format]`, la
 *   serie se considera completada con ese ganador.
 * - Si todos los matches BO1 terminaron 0-0 → `needsTiebreaker=true`.
 */
export function computeSeriesProgress(
  homeTeamId: string | null,
  awayTeamId: string | null,
  format: PlayoffFormat,
  matches: SeriesGameOutcome[],
): SeriesProgress {
  let homeWins = 0;
  let awayWins = 0;
  let finishedNonOrganic0to0 = 0;
  let totalFinished = 0;

  for (const m of matches) {
    if (
      m.status !== 'finalizado' &&
      m.status !== 'finalizado_con_resolucion'
    ) {
      continue;
    }
    totalFinished++;

    if (!m.countsForStandings) {
      finishedNonOrganic0to0++;
      continue;
    }

    if (m.homeScore > m.awayScore) {
      if (m.homeTeamId === homeTeamId) homeWins++;
      else if (m.homeTeamId === awayTeamId) awayWins++;
    } else if (m.awayScore > m.homeScore) {
      if (m.awayTeamId === awayTeamId) awayWins++;
      else if (m.awayTeamId === homeTeamId) homeWins++;
    }
  }

  const need = WINS_TO_CLINCH[format];

  if (homeWins >= need) {
    return {
      homeWins,
      awayWins,
      isCompleted: true,
      winnerTeamId: homeTeamId,
      loserTeamId: awayTeamId,
      needsTiebreaker: false,
    };
  }
  if (awayWins >= need) {
    return {
      homeWins,
      awayWins,
      isCompleted: true,
      winnerTeamId: awayTeamId,
      loserTeamId: homeTeamId,
      needsTiebreaker: false,
    };
  }

  // BO1 con todos los matches sin ganador orgánico → tiebreaker manual
  const needsTiebreaker =
    format === 'BO1' &&
    totalFinished >= 1 &&
    finishedNonOrganic0to0 === totalFinished;

  return {
    homeWins,
    awayWins,
    isCompleted: false,
    winnerTeamId: null,
    loserTeamId: null,
    needsTiebreaker,
  };
}
