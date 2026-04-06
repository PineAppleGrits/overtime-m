import teamBalanceMock from '../../mock/team-balance.json'

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

// TODO: reemplazar con GET /teams/:id/balance
export async function getTeamBalance(teamId: string): Promise<TeamBalance> {
  const data = teamBalanceMock as Record<string, TeamBalance>
  return data[teamId] ?? data['fallback']
}
