/**
 * Códigos de deporte y modalidad soportados.
 * Sincronizado con `apps/api/src/common/sport-rules/sport-rules.types.ts`.
 */
export const SPORT_CODES = ['BASKETBALL'] as const;
export type SportCode = (typeof SPORT_CODES)[number];

export const BASKETBALL_MODALITIES = ['5v5', '3v3'] as const;
export type BasketballModality = (typeof BASKETBALL_MODALITIES)[number];

export type Modality = BasketballModality;

/**
 * Vista pública de las reglas de un deporte+modalidad.
 * El API expone esto para que el FE muestre límites (rosters, mínimos)
 * sin tener que hardcodearlos.
 */
export interface SportRulesPublic {
  sportCode: SportCode;
  modality: Modality;
  key: string;
  scoring: {
    win: number;
    loss: number;
    noShow: number;
    draw: number;
  };
  roster: {
    rosterMin: number;
    rosterMax: number;
    playersOnCourt: number;
    minPlayersToStart: number;
  };
  staff: {
    minReferees: number;
    minTableOfficials: number;
    idealReferees: number;
    idealTableOfficials: number;
  };
}
