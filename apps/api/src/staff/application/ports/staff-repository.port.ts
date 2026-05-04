import { StaffState, StaffTypeValue } from '../../domain/entities/staff.entity';

/**
 * Datos enriquecidos que devuelven los reads del repositorio (incluye
 * `availability` y un `_count.matchStaff` para listados de staff).
 */
export interface StaffRow extends StaffState {
  availability: AvailabilityRow[];
  /** Conteo de asignaciones activas. Opcional, solo lo carga cuando el caller lo pide. */
  assignmentsCount?: number;
}

export interface AvailabilityRow {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateStaffInput {
  profileId?: string | null;
  type: StaffTypeValue;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

export interface UpdateStaffInput {
  type?: StaffTypeValue;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

export interface ListStaffFilter {
  type?: StaffTypeValue;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
}

export interface IStaffRepository {
  create(input: CreateStaffInput): Promise<StaffRow>;
  findById(id: string): Promise<StaffRow | null>;
  findByProfileId(profileId: string): Promise<StaffRow | null>;
  list(
    filter: ListStaffFilter,
  ): Promise<{ data: StaffRow[]; total: number; page: number; limit: number }>;
  update(id: string, patch: UpdateStaffInput): Promise<StaffRow>;
  softDelete(id: string): Promise<void>;
}

export const STAFF_REPOSITORY = Symbol('STAFF_REPOSITORY');
