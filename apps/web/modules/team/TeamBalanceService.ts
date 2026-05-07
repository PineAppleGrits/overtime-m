import { client } from '../common/client/baseClient'

export interface RegistrationBalance {
  id: string
  tournamentName: string
  categoryName: string
  inscriptionAmount: number
  insuranceAmount: number
  playersCount: number
  totalAmount: number
  paidAmount: number
  status: 'pending_payment' | 'voucher_sent' | 'paid'
  voucherUrl: string | null
}

export interface Suspension {
  profileId: string
  playerName: string
  reason: string
  totalGames: number
  remainingGames: number
  endDate: string
  isActive: boolean
}

export interface TeamBalance {
  totalDebt: number
  totalPaid: number
  pendingConfirmation: number
  registrations: RegistrationBalance[]
  suspensions: Suspension[]
}

const EMPTY_BALANCE: TeamBalance = {
  totalDebt: 0,
  totalPaid: 0,
  pendingConfirmation: 0,
  registrations: [],
  suspensions: [],
}

/** BE-MOCK-004 — balance financiero + suspensiones del team. */
export async function getTeamBalance(teamId: string): Promise<TeamBalance> {
  try {
    const { data } = await client.get<TeamBalance>(`/teams/${teamId}/balance`)
    return data
  } catch (error) {
    console.error('Error fetching team balance:', error)
    return EMPTY_BALANCE
  }
}
