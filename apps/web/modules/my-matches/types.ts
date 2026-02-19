/**
 * Types for the "Mis Partidos" module.
 * Represents the assigned matches for the current logged-in employee.
 */

export type MatchStatus =
  | 'programado'
  | 'en_curso'
  | 'suspendido'
  | 'cancelado'
  | 'reprogramado'
  | 'finalizado'

export type EmployeeMatchRole = 'arbitro' | 'fotografo' | 'agente_mesa'

export interface MatchDetail {
  id: string
  homeTeamName: string
  awayTeamName: string
  matchDate: string
  matchTime?: string
  venueName: string
  status: MatchStatus
  homeScore?: number
  awayScore?: number
  categoryName?: string
  tournamentName?: string
}

export interface MyMatchAssignment {
  id: string
  matchId: string
  employeeId: string
  role: EmployeeMatchRole
  match: MatchDetail
}

export interface UpdateMatchScoreInput {
  matchId: string
  homeScore: number
  awayScore: number
}

export interface ChangeMatchStatusInput {
  matchId: string
  status: MatchStatus
}
