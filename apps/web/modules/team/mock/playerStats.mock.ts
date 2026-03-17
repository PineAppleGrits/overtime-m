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
  picture?: string // URL de foto del media day
}

export type TeamPlayerStatsMap = Record<string, PlayerStats>

// ─────────────────────────────────────────────────────────
// Mock data – reemplazar con respuesta real de la API
// ─────────────────────────────────────────────────────────
const MOCK_TEAM_STATS: Record<string, TeamStats> = {
  // 'team-uuid': {
  //   playedMatches: 10, won: 7, lost: 3,
  //   pointsFor: 820, pointsAgainst: 710,
  // }
}

const MOCK_PLAYER_STATS: Record<string, TeamPlayerStatsMap> = {
  // 'team-uuid': {
  //   'profile-uuid': {
  //     played: 8, points: 120, pt1: 18, pt2: 48, pt3: 24,
  //     fouls: 20, steals: 12, rebounds: 35, assists: 28,
  //   }
  // }
}

export function getMockTeamStats(teamId: string): TeamStats | null {
  return MOCK_TEAM_STATS[teamId] ?? null
}

export function getMockPlayerStats(teamId: string): TeamPlayerStatsMap {
  return MOCK_PLAYER_STATS[teamId] ?? {}
}
