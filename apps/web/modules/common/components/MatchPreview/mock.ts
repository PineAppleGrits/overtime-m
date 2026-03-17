/**
 * Mock de partidos por equipo.
 *
 * TODO: Reemplazar por llamada a la API cuando el endpoint esté disponible.
 * Endpoint esperado: GET /teams/:id/matches?type=last|next
 * Response: { lastMatch: MatchPreviewData | null, nextMatch: MatchPreviewData | null }
 */

import type { MatchPreviewData } from './types'

interface TeamMatches {
  lastMatch: MatchPreviewData | null
  nextMatch: MatchPreviewData | null
}

const MOCK_MATCHES: Record<string, TeamMatches> = {
  // 'team-uuid': {
  //   lastMatch: {
  //     id: 'match-uuid',
  //     date: '2026-03-10T20:00:00Z',
  //     location: 'Estadio OT · Cancha 1',
  //     matchType: 'Zona Regular',
  //     team1: { id: 'team-uuid', name: 'Los Pumas', logoUrl: undefined },
  //     team2: { id: 'other-uuid', name: 'Tigres FC', logoUrl: undefined },
  //     team1Score: 78,
  //     team2Score: 65,
  //   },
  //   nextMatch: {
  //     id: 'next-uuid',
  //     date: '2026-03-24T20:00:00Z',
  //     location: 'Estadio OT · Cancha 2',
  //     matchType: 'Zona Regular',
  //     team1: { id: 'other2-uuid', name: 'Cóndores', logoUrl: undefined },
  //     team2: { id: 'team-uuid', name: 'Los Pumas', logoUrl: undefined },
  //   },
  // },
}

export function getMockTeamMatches(teamId: string): TeamMatches {
  return MOCK_MATCHES[teamId] ?? { lastMatch: null, nextMatch: null }
}
