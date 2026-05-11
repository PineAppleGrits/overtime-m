import type { Modality, SportCode } from '../../../common/sport-rules/sport-rules.types';

export const TEAM_SPORT_RULES_PORT = Symbol('TEAM_SPORT_RULES_PORT');

export interface TeamSportRulesPort {
  getRosterBounds(
    sportCode: SportCode,
    modality: Modality,
  ): { rosterMin: number; rosterMax: number } | null;
}

