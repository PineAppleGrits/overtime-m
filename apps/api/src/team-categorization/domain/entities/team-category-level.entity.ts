/**
 * Entidad de dominio TeamCategoryLevel — asignación de un nivel global
 * a un equipo (RN-039, RN-044). Hasta 2 por equipo.
 */
export class TeamCategoryLevel {
  constructor(
    public readonly id: string,
    public readonly teamId: string,
    public readonly categoryLevelId: string,
    public readonly grantedByProfileId: string,
    public readonly grantedAt: Date,
    public readonly notes: string | null,
  ) {}
}
