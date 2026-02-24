/**
 * Admin module types
 */

// ============ Tournament Types ============
export type TournamentStatus = 'draft' | 'published' | 'archived'

export type PaymentMethod = 'transferencia' | 'efectivo' | 'configurado'

export interface TournamentPricing {
  id: string
  tournamentId: string
  paymentMethod: PaymentMethod
  amount: number
  dateFrom: string
  dateTo: string
  isActive: boolean
}

export interface AdminTournament {
  id: string
  name: string
  slug: string
  description?: string
  sportId: string
  sportName?: string
  status: TournamentStatus
  startDate: string
  endDate: string
  registrationStartDate?: string
  registrationEndDate?: string
  registrationOpen: boolean
  pricing: TournamentPricing[]
  categories: AdminCategory[]
  createdAt: string
  updatedAt: string
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  tournamentId: string
  sportId: string
  teamsPerZone?: number
  zones: AdminZone[]
  hidden: boolean
}

export interface AdminZone {
  id: string
  name: string
  slug: string
  categoryId: string
  fixtureAlgorithm?: 'round_robin' | 'custom'
  teams: AdminTeamInZone[]
  hidden: boolean
}

export interface AdminTeamInZone {
  id: string
  teamId: string
  teamName: string
  zoneId: string
}

// ============ Team Types ============
export interface AdminTeam {
  id: string
  name: string
  slug: string
  logoUrl?: string
  sportId: string
  sportName?: string
  captainId?: string
  captainName?: string
  ownerId?: string
  ownerName?: string
  category?: string
  parentTeamId?: string
  parentTeamName?: string
  players: AdminPlayerInTeam[]
  createdAt: string
  updatedAt: string
}

export interface AdminPlayerInTeam {
  id: string
  playerId: string
  firstName: string
  lastName: string
  jerseyNumber?: number
  position?: string
  photoUrl?: string
}

// ============ Player Types ============
export interface AdminPlayer {
  id: string
  firstName: string
  lastName: string
  documentNumber?: string
  jerseyNumber?: number
  position?: string
  height?: number
  weight?: number
  photoUrl?: string
  userId?: string
  isBlacklisted: boolean
  teams: { id: string; name: string }[]
  createdAt: string
  updatedAt: string
}

// ============ Blacklist Types ============
export interface BlacklistEntry {
  id: string
  firstName: string
  lastName: string
  documentNumber: string
  reason: string
  createdAt: string
  createdBy: string
  isActive: boolean
}

// ============ Employee Types ============
export type EmployeeRole = 'arbitro' | 'fotografo' | 'agente_mesa'

export interface Employee {
  id: string
  userId?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role: EmployeeRole
  isActive: boolean
  assignedMatches: AssignedMatch[]
  createdAt: string
  updatedAt: string
}

export interface AssignedMatch {
  id: string
  matchId: string
  employeeId: string
  role: EmployeeRole
  match: {
    id: string
    homeTeamName: string
    awayTeamName: string
    matchDate: string
    matchTime?: string
    venueName: string
    status: string
    homeScore?: number
    awayScore?: number
  }
}

// ============ Venue Types ============
export interface AdminVenue {
  id: string
  name: string
  address?: string
  city?: string
  province?: string
  country?: string
  googleMapsUrl?: string
  capacity?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============ Discipline/Sport Types ============
export interface AdminSport {
  id: string
  name: string
  code: string
  description?: string
  createdAt: string
  updatedAt: string
}

// ============ Site Config Types ============
export interface SiteConfig {
  id: string
  siteName: string
  siteDescription?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail?: string
  contactPhone?: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
  }
  paymentConfig?: {
    mercadoPagoEnabled: boolean
    mercadoPagoPublicKey?: string
    bankTransferEnabled: boolean
    bankTransferDetails?: string
    cashEnabled: boolean
  }
  updatedAt: string
}

// ============ Registration Types ============
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface AdminRegistration {
  id: string
  teamId: string
  teamName: string
  tournamentId: string
  tournamentName: string
  categoryId: string
  categoryName: string
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paymentAmount?: number
  isManual: boolean
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}
