/**
 * Port para resolver datos de contexto que el módulo Friendlies necesita
 * pero que viven en otros módulos (Teams, Profile). Mantiene a Friendlies
 * desacoplado de las implementaciones concretas y permite mockear en tests.
 */

export interface TeamContext {
  id: string;
  name: string;
  sportId: string;
  creatorProfileId: string | null;
  captainProfileId: string | null;
}

export interface DelegateRecipient {
  profileId: string;
  email: string;
  name: string;
}

export interface IFriendlyContext {
  /**
   * Retorna info básica de equipos por id. Si alguno no existe, no se incluye
   * en el resultado (el caller chequea longitud).
   */
  findTeamsByIds(ids: string[]): Promise<TeamContext[]>;
  /**
   * Lista delegados (creator + captain) de un equipo con email para notificar.
   */
  findDelegatesForTeam(teamId: string): Promise<DelegateRecipient[]>;
  /**
   * ¿El profileId actúa como delegado del equipo? Acepta creator o captain.
   */
  isDelegateOfTeam(profileId: string, teamId: string): Promise<boolean>;
  /**
   * Para validaciones cruzadas: lista los equipos sobre los que el usuario
   * tiene rol de delegado (creator o captain). Usado para filtrar listados.
   */
  findTeamsWhereDelegate(profileId: string): Promise<string[]>;
}

export const FRIENDLY_CONTEXT = Symbol('FRIENDLY_CONTEXT');
