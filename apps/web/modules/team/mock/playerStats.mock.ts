/**
 * Mock de estadísticas de equipo y jugadores.
 *
 * TODO: Reemplazar por llamada a la API cuando el endpoint esté disponible.
 * Endpoint esperado: GET /teams/:id/stats
 * Response: {
 *   team: TeamStats,
 *   players: Array<{ profileId: string } & PlayerStats>
 * }
 */

import teamStatsData from '../../../mock/team-stats.json'
import playerStatsData from '../../../mock/player-stats.json'

// ── Estadísticas de equipo ────────────────────────────────
export interface TeamStats {
  playedMatches: number
  won: number
  lost: number
  pointsFor: number       // Total puntos anotados
  pointsAgainst: number   // Total puntos recibidos
}

// ── Estadísticas por jugador ─────────────────────────────
export interface PlayerStats {
  played: number
  points: number
  pt1: number      // Tiros libres (total)
  pt2: number      // Tiros de campo 2P (total)
  pt3: number      // Tiros de campo 3P (total)
  fouls: number    // Faltas (total)
  steals: number   // Robos (total)
  rebounds: number // Rebotes (total)
  assists: number  // Asistencias (total)
  picture?: string | null // URL de foto del media day
}

export type TeamPlayerStatsMap = Record<string, PlayerStats>

// ─────────────────────────────────────────────────────────
// Mock data – reemplazar con respuesta real de la API
// ─────────────────────────────────────────────────────────
const MOCK_TEAM_STATS = teamStatsData as Record<string, TeamStats>

const MOCK_PLAYER_STATS = playerStatsData as Record<string, TeamPlayerStatsMap>

export function getMockTeamStats(teamId: string): TeamStats | null {
  return MOCK_TEAM_STATS[teamId] ?? null
}

export function getMockPlayerStats(teamId: string): TeamPlayerStatsMap {
  return MOCK_PLAYER_STATS[teamId] ?? {}
}
