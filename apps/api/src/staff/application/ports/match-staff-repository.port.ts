export interface MatchStaffRow {
  id: string;
  matchId: string;
  staffId: string;
  role: string;
  status: string;
  assignedBy: string | null;
  assignedAt: Date | null;
  createdAt: Date;
}

export interface MatchSummary {
  id: string;
  matchDate: Date;
  matchTime: string | null;
  status: string;
}

/**
 * Snapshot de un partido necesario para reglas de asignación de staff
 * (validar fecha/hora, role del staff, conflict detection).
 */
export interface MatchForStaffAssignment {
  id: string;
  matchDate: Date;
  matchTime: string | null;
  status: string;
}

export interface CreateMatchStaffInput {
  matchId: string;
  staffId: string;
  role: string;
  status: string;
  assignedBy?: string | null;
  assignedAt?: Date | null;
}

export interface IMatchStaffRepository {
  create(input: CreateMatchStaffInput): Promise<MatchStaffRow>;
  delete(id: string): Promise<void>;

  findByMatchAndStaffAndRole(
    matchId: string,
    staffId: string,
    role: string,
    statuses?: string[],
  ): Promise<MatchStaffRow | null>;

  findByMatchAndStaff(
    matchId: string,
    staffId: string,
  ): Promise<MatchStaffRow | null>;

  findByMatch(matchId: string): Promise<MatchStaffRow[]>;

  /**
   * Devuelve la asignación que entra en conflicto: mismo staff, mismo matchDate
   * + matchTime, en estados activos. Para detectar superposición horaria.
   */
  findConflictingAssignment(input: {
    staffId: string;
    matchDate: Date;
    matchTime: string | null;
    excludeMatchId?: string;
  }): Promise<MatchStaffRow | null>;

  findAssignmentsForStaff(
    staffId: string,
    options?: { matchStatus?: string; activeOnly?: boolean },
  ): Promise<Array<MatchStaffRow & { match: MatchSummary }>>;

  /**
   * Trae el match con los datos mínimos que necesita la asignación.
   */
  findMatch(matchId: string): Promise<MatchForStaffAssignment | null>;
}

export const MATCH_STAFF_REPOSITORY = Symbol('MATCH_STAFF_REPOSITORY');
