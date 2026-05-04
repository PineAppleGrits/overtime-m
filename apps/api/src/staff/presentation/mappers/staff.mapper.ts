import { StaffRow } from '../../application/ports/staff-repository.port';
import { MatchStaffRow, MatchSummary } from '../../application/ports/match-staff-repository.port';

export interface StaffResponseDto {
  id: string;
  profileId: string | null;
  type: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  availability: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  assignmentsCount?: number;
}

export function toStaffResponse(row: StaffRow): StaffResponseDto {
  return {
    id: row.id,
    profileId: row.profileId,
    type: row.type,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    availability: row.availability.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })),
    assignmentsCount: row.assignmentsCount,
  };
}

export interface MatchStaffResponseDto {
  id: string;
  matchId: string;
  staffId: string;
  role: string;
  status: string;
  assignedBy: string | null;
  assignedAt: string | null;
  createdAt: string;
  match?: {
    id: string;
    matchDate: string;
    matchTime: string | null;
    status: string;
  };
}

export function toMatchStaffResponse(
  row: MatchStaffRow & { match?: MatchSummary },
): MatchStaffResponseDto {
  return {
    id: row.id,
    matchId: row.matchId,
    staffId: row.staffId,
    role: row.role,
    status: row.status,
    assignedBy: row.assignedBy,
    assignedAt: row.assignedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    match: row.match
      ? {
          id: row.match.id,
          matchDate: row.match.matchDate.toISOString(),
          matchTime: row.match.matchTime,
          status: row.match.status,
        }
      : undefined,
  };
}
