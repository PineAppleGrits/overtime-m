/**
 * Mock helpers para `team-stats.json` y `player-stats.json`.
 *
 * Mantenido temporalmente hasta que termine la implementación de
 * `MatchPlayerStat` en BE (BE-MOCK-005). Una vez disponibles los endpoints
 * `GET /teams/:id/stats` y `GET /teams/:id/player-stats`, este archivo se
 * borra junto con los JSON.
 */

import teamStatsData from './team-stats.json'
import playerStatsData from './player-stats.json'

export interface TeamStats {
  playedMatches: number
  won: number
  lost: number
  pointsFor: number       // Total puntos anotados
  pointsAgainst: number   // Total puntos recibidos
}

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
  picture?: string | null
}

export type TeamPlayerStatsMap = Record<string, PlayerStats>

const MOCK_TEAM_STATS = teamStatsData as Record<string, TeamStats>
const MOCK_PLAYER_STATS = playerStatsData as Record<string, TeamPlayerStatsMap>

export function getMockTeamStats(teamId: string): TeamStats | null {
  return MOCK_TEAM_STATS[teamId] ?? null
}

export function getMockPlayerStats(teamId: string): TeamPlayerStatsMap {
  return MOCK_PLAYER_STATS[teamId] ?? {}
}
