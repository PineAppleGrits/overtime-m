/**
 * Mock de partidos por equipo.
 *
 * TODO: Reemplazar por llamada a la API cuando el endpoint esté disponible.
 * Endpoint esperado: GET /teams/:id/matches?type=last|next
 * Response: { lastMatch: MatchPreviewData | null, nextMatch: MatchPreviewData | null }
 */

import type { MatchPreviewData } from './types'
import teamMatchesData from '../../../../mock/team-matches.json'

interface TeamMatches {
  lastMatch: MatchPreviewData | null
  nextMatch: MatchPreviewData | null
}

const MOCK_MATCHES = teamMatchesData as Record<string, TeamMatches>

export function getMockTeamMatches(teamId: string): TeamMatches {
  // Buscar primero por teamId, luego fallback
  if (MOCK_MATCHES[teamId]) {
    return MOCK_MATCHES[teamId]
  }

  return MOCK_MATCHES['fallback'] ?? { lastMatch: null, nextMatch: null }
}
