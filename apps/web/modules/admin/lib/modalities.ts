export const MODALITIES_BY_SPORT: Record<string, string[]> = {
  BASKET: ['3v3', '5v5'],
  FOOTBALL: ['5v5', '7v7', '8v8', '11v11'],
}

export function getModalitiesForSport(sportCode?: string): string[] {
  if (!sportCode) return []
  return MODALITIES_BY_SPORT[sportCode] ?? []
}
