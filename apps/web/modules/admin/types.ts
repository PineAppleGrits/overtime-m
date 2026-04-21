/**
 * Admin module types
 */

// ============ Tournament Types ============
export type TournamentStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'CLOSED'
  | 'READY_TO_SHIP'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'ARCHIVED'
  | 'CANCELLED'

export type FixtureFormat = 'SINGLE_ROUND' | 'DOUBLE_ROUND'

export type PaymentMethod = 'transferencia' | 'efectivo' | 'configurado'

export interface TournamentPricing {
  id: string
  tournamentId: string
  validFrom: string
  validTo: string
  cashAmount: number
  transferAmount: number
  currency: string
}

export interface AdminTournament {
  id: string
  name: string
  slug: string
  description?: string | null
  sportId: string
  sport: { id: string; name: string; code: string }
  status: TournamentStatus
  startDate: string | null
  endDate: string | null
  registrationStartDate?: string | null
  registrationEndDate?: string | null
  teamOperationsOpenAt?: string | null
  teamOperationsCloseAt?: string | null
  insurancePerPlayer?: number | null
  fixtureFormat?: FixtureFormat
  modality?: string | null
  registrationPricing: TournamentPricing[]
  categories: AdminCategory[]
  _count?: { categories: number; registrations: number }
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
  sport: { id: string; name: string; code?: string }
  captainId?: string | null
  captain?: { id: string; name: string; avatarUrl?: string | null } | null
  creatorId?: string
  creator?: { id: string; name: string; email?: string }
  franchiseId?: string | null
  franchise?: { id: string; name: string; slug: string; logoUrl?: string | null } | null
  members: AdminMember[]
  teamZones?: AdminTeamZone[]
  registrations?: AdminTeamRegistration[]
  createdAt: string
  updatedAt: string
}

export interface AdminMember {
  id: string
  profileId: string
  isActive: boolean
  position?: string | null
  profile: {
    id: string
    name: string
    email?: string | null
    avatarUrl?: string | null
    documentNumber?: string | null
  }
}

export interface AdminTeamZone {
  id: string
  zone: {
    id: string
    name: string
    category: {
      id: string
      name: string
      tournament: { id: string; name: string }
    }
  }
}

export interface AdminTeamRegistration {
  id: string
  status: string
  tournament: { id: string; name: string }
  category: { id: string; name: string }
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

// ============ User Types ============
export type ProfileRole = 'master' | 'admin' | 'player' | 'photographer' | 'referee' | 'official'

export interface AdminUser {
  id: string
  name: string
  email?: string
  phone?: string
  documentNumber?: string
  dateOfBirth?: string
  role: ProfileRole
  createdAt: string
  updatedAt: string
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
