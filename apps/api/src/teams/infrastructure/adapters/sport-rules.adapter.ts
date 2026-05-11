import { Injectable } from '@nestjs/common';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import type { Modality, SportCode } from '../../../common/sport-rules/sport-rules.types';
import type { TeamSportRulesPort } from '../../application/ports/team-sport-rules.port';

@Injectable()
export class TeamSportRulesAdapter implements TeamSportRulesPort {
  constructor(private readonly sportRules: SportRulesRegistry) {}

  getRosterBounds(
    sportCode: SportCode,
    modality: Modality,
  ): { rosterMin: number; rosterMax: number } | null {
    const rules = this.sportRules.tryGet(sportCode, modality);

    if (!rules) {
      return null;
    }

    return {
      rosterMin: rules.roster.rosterMin,
      rosterMax: rules.roster.rosterMax,
    };
  }
}

