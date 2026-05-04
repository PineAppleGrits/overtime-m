/**
 * Estado de cumplimiento de la lista de buena fe del equipo (RN-009)
 * para una modalidad concreta. La modalidad la decide el llamador
 * porque `Team` no tiene una modality propia.
 */
export interface TeamRosterStatusDto {
  teamId: string;
  modality: string; // ej '5v5' | '3v3'
  count: number;
  min: number;
  max: number;
  isValid: boolean;
}
