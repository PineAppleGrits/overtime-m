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
 * RN-009 + decisión del usuario:
 * - 5v5: roster mínimo 8, máximo 25 (referencial — DP-002 a confirmar).
 * - 5v5: 5 en cancha; mínimo 5 para que el partido se juegue (FIBA).
 */
const ROSTER_5V5: RosterRules = {
  rosterMin: 8,
  rosterMax: 25,
  playersOnCourt: 5,
  minPlayersToStart: 5,
};

export class Basketball5v5Rules implements SportRules {
  readonly sportCode: SportCode = BASKETBALL_SPORT_CODE;
  readonly modality: Modality = '5v5';
  readonly key = 'BASKETBALL_5v5';
  readonly scoring = BASKETBALL_SCORING;
  readonly roster = ROSTER_5V5;
  readonly staff = BASKETBALL_STAFF;
  readonly playoff = BASKETBALL_PLAYOFF;

  validateScore(home: number, away: number): string | null {
    return basketballValidateScore(home, away);
  }

  scoreCountsForStandings(home: number, away: number): boolean {
    return basketballScoreCountsForStandings(home, away);
  }
}
