/**
 * Puerto que provee contexto de dominio (perfiles, equipos, partidos, deudas)
 * a los listeners. Aísla del Prisma concreto y simplifica los mocks en tests.
 */
export interface ProfileContact {
  id: string;
  email: string | null;
  name: string;
}

export interface TeamWithCaptain {
  id: string;
  name: string;
  captain: ProfileContact | null;
}

export interface MatchSummary {
  id: string;
  homeTeam: TeamWithCaptain | null;
  awayTeam: TeamWithCaptain | null;
}

export interface FriendlySummary {
  id: string;
  homeTeam: TeamWithCaptain | null;
  awayTeam: TeamWithCaptain | null;
  matchDate: Date | null;
  venueName: string | null;
  depositAmount?: number;
  depositDeadline?: Date | null;
}

export interface RegistrationSummary {
  id: string;
  team: TeamWithCaptain | null;
  tournamentName: string;
  categoryName: string | null;
  rejectionReason: string | null;
  requester: ProfileContact | null;
}

export interface DebtSummary {
  id: string;
  type: string;
  amount: number;
  currency: string;
  dueDate: Date | null;
  team: TeamWithCaptain | null;
  profile: ProfileContact | null;
  conceptLabel: string;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  currency: string;
  conceptLabel: string;
  paidByProfile: ProfileContact | null;
}

export interface SanctionSummary {
  id: string;
  type: string;
  description: string | null;
  fechasAffected: number | null;
  targetProfile: ProfileContact | null;
  targetTeam: TeamWithCaptain | null;
}

export interface INotificationContextPort {
  findRegistration(id: string): Promise<RegistrationSummary | null>;
  findMatch(id: string): Promise<MatchSummary | null>;
  findFriendly(id: string): Promise<FriendlySummary | null>;
  findDebt(id: string): Promise<DebtSummary | null>;
  findPayment(id: string): Promise<PaymentSummary | null>;
  findSanction(id: string): Promise<SanctionSummary | null>;
  findProfile(id: string): Promise<ProfileContact | null>;
  /** Lista de admins/masters con email — para enviarles notificaciones operativas (RN-036). */
  findAdminsWithEmail(): Promise<ProfileContact[]>;
}

export const NOTIFICATION_CONTEXT_PORT = Symbol('NOTIFICATION_CONTEXT_PORT');
