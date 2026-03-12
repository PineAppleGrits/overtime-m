'use server'

import TeamService from './TeamService'

type TeamDto = {
  id: string
  name: string
  logo?: string | null
}

export async function getTeamsAction(params?: {
  page?: number
  limit?: number
  q?: string
}): Promise<{ success: boolean; data?: TeamDto[]; error?: string }> {
  try {
    const response = await TeamService.getTeams(params)
    const teams = response.data?.data ?? response.data ?? []
    return { success: true, data: Array.isArray(teams) ? teams : [] }
  } catch (error) {
    console.error('Error fetching teams:', error)
    return { success: false, error: 'Error al obtener los equipos' }
  }
}
