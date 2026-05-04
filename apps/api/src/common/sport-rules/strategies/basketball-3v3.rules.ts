import {
  Modality,
  RosterRules,
  SportCode,
  SportRules,
} from '../sport-rules.types';
import {
  BASKETBALL_PLAYOFF,
  BASKETBALL_SCORING,
  BASKETBALL_SPORT_CODE,
  BASKETBALL_STAFF,
  basketballScoreCountsForStandings,
  basketballValidateScore,
} from './basketball-base.rules';

/**
 * Decisión del usuario:
 * - 3v3: roster mínimo 4, máximo 6 (por ahora).
 * - 3v3: 3 en cancha; mínimo 3 para jugar.
 * - Staff y scoring FIBA estándar (igual que 5v5).
 */
const ROSTER_3V3: RosterRules = {
  rosterMin: 4,
  rosterMax: 6,
  playersOnCourt: 3,
  minPlayersToStart: 3,
};

export class Basketball3v3Rules implements SportRules {
  readonly sportCode: SportCode = BASKETBALL_SPORT_CODE;
  readonly modality: Modality = '3v3';
  readonly key = 'BASKETBALL_3v3';
  readonly scoring = BASKETBALL_SCORING;
  readonly roster = ROSTER_3V3;
  readonly staff = BASKETBALL_STAFF;
  readonly playoff = BASKETBALL_PLAYOFF;

  validateScore(home: number, away: number): string | null {
    return basketballValidateScore(home, away);
  }

  scoreCountsForStandings(home: number, away: number): boolean {
    return basketballScoreCountsForStandings(home, away);
  }
}
