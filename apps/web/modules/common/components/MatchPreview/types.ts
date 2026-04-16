export interface MatchTeam {
  id: string
  name: string
  logoUrl?: string
}

export interface MatchPreviewData {
  id: string
  tournamentSlug?: string
  categorySlug?: string
  date?: string
  location?: string
  matchType: string
  team1: MatchTeam
  team2: MatchTeam
  team1Score?: number
  team2Score?: number
}
