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

// Datos de ejemplo usados para cualquier equipo mientras no hay API
const FALLBACK_MATCHES: TeamMatches = {
  lastMatch: {
    id: 'mock-last',
    date: '2026-03-10T20:00:00Z',
    location: 'Estadio OT · Cancha 1',
    matchType: 'Zona Regular',
    team1: { id: 'mock-t1', name: 'Los Pumas' },
    team2: { id: 'mock-t2', name: 'Tigres FC' },
    team1Score: 78,
    team2Score: 65,
  },
  nextMatch: {
    id: 'mock-next',
    date: '2026-03-24T20:00:00Z',
    location: 'Estadio OT · Cancha 2',
    matchType: 'Zona Regular',
    team1: { id: 'mock-t3', name: 'Cóndores' },
    team2: { id: 'mock-t1', name: 'Los Pumas' },
  },
}

const MOCK_MATCHES: Record<string, TeamMatches> = {}

export function getMockTeamMatches(teamId: string): TeamMatches {
  // TODO: Reemplazar FALLBACK_MATCHES por { lastMatch: null, nextMatch: null }
  // cuando la API esté lista, para no mostrar datos falsos en producción
  return MOCK_MATCHES[teamId] ?? FALLBACK_MATCHES
}
