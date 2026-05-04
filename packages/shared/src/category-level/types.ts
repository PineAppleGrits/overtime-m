export interface CategoryLevelDto {
  id: string;
  sportId: string;
  code: string; // 'A', 'B', 'C', 'D' ...
  displayName: string;
  rank: number; // 1 = más alto
  createdAt: string;
  updatedAt: string;
}

export interface TeamCategoryLevelDto {
  id: string;
  teamId: string;
  categoryLevelId: string;
  grantedByProfileId: string;
  grantedAt: string;
  notes: string | null;
}

/**
 * Vista combinada útil para mostrar la categorización de un equipo
 * en una pantalla.
 */
export interface TeamCategorizationDto {
  teamId: string;
  levels: CategoryLevelDto[];
  observedFriendlies: number;
  isCategorized: boolean;
}
