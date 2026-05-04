import { TeamCategoryLevel } from '../../domain/entities/team-category-level.entity';

export interface AssignTeamLevelInput {
  teamId: string;
  categoryLevelId: string;
  grantedByProfileId: string;
  notes?: string | null;
}

export const TEAM_CATEGORY_LEVEL_REPOSITORY = Symbol(
  'ITeamCategoryLevelRepository',
);

export interface ITeamCategoryLevelRepository {
  /** Niveles asignados al equipo. */
  listByTeam(teamId: string): Promise<TeamCategoryLevel[]>;

  /** Reemplaza el set completo de niveles del equipo (transaccional). */
  replaceForTeam(
    teamId: string,
    inputs: AssignTeamLevelInput[],
  ): Promise<TeamCategoryLevel[]>;

  /** Agrega niveles sin reemplazar los existentes (transaccional, idempotente). */
  addForTeam(
    inputs: AssignTeamLevelInput[],
  ): Promise<TeamCategoryLevel[]>;

  /** Quita un nivel concreto del equipo. Devuelve true si se borró. */
  removeForTeam(teamId: string, teamCategoryLevelId: string): Promise<boolean>;

  /** ¿El equipo tiene este nivel asignado? */
  hasLevel(teamId: string, categoryLevelId: string): Promise<boolean>;

  /**
   * Lista los teamIds que cumplen tener N o más amistosos observados para
   * categorización (Friendly.observedForCategorization=true), agrupados por
   * teamId. Devuelve también el conteo y limita a equipos sin niveles.
   *
   * `minObserved` = umbral mínimo (DP-008 — default 3 hasta cierre).
   */
  listPendingCategorization(minObserved: number): Promise<
    Array<{
      teamId: string;
      teamName: string;
      observedFriendlies: number;
    }>
  >;
}
