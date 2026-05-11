const BASKETBALL_MODALITIES = ['3v3', '5v5']
const FOOTBALL_MODALITIES = ['5v5', '7v7', '8v8', '11v11']

export const MODALITIES_BY_SPORT: Record<string, string[]> = {
  BASKET: BASKETBALL_MODALITIES,
  BASKETBALL: BASKETBALL_MODALITIES,
  BASQUET: BASKETBALL_MODALITIES,
  BASQUETBOL: BASKETBALL_MODALITIES,
  FOOTBALL: FOOTBALL_MODALITIES,
  FUTBOL: FOOTBALL_MODALITIES,
  SOCCER: FOOTBALL_MODALITIES,
}

export function getModalitiesForSport(sportCode?: string): string[] {
  if (!sportCode) return []
  return MODALITIES_BY_SPORT[sportCode.toUpperCase()] ?? []
}
