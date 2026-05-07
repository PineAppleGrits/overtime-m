/**
 * Mock helper para `team-matches.json`.
 *
 * El consumidor real (equipos/[id]/page.tsx) ya migró al endpoint
 * `GET /teams/:id/matches` (BE-MOCK-001). Este helper queda como referencia
 * y para tests/storybook si fuera necesario.
 */

import type { MatchPreviewData } from '@/modules/common/components/MatchPreview/types'
import teamMatchesData from './team-matches.json'

interface TeamMatches {
  lastMatch: MatchPreviewData | null
  nextMatch: MatchPreviewData | null
}

const MOCK_MATCHES = teamMatchesData as Record<string, TeamMatches>

export function getMockTeamMatches(teamId: string): TeamMatches {
  if (MOCK_MATCHES[teamId]) {
    return MOCK_MATCHES[teamId]
  }
  return MOCK_MATCHES['fallback'] ?? { lastMatch: null, nextMatch: null }
}
