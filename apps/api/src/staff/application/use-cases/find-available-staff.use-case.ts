import { Inject, Injectable } from '@nestjs/common';
import { StaffTypeValue } from '../../domain/entities/staff.entity';
import {
  IStaffAvailabilityRepository,
  STAFF_AVAILABILITY_REPOSITORY,
} from '../ports/staff-availability-repository.port';
import {
  IMatchStaffRepository,
  MATCH_STAFF_REPOSITORY,
} from '../ports/match-staff-repository.port';
import {
  IStaffRepository,
  STAFF_REPOSITORY,
  StaffRow,
} from '../ports/staff-repository.port';

export interface FindAvailableStaffInput {
  /** Fecha del partido (con hora — usamos toLocaleTimeString HH:mm). */
  date: Date;
  type?: StaffTypeValue;
  /** Excluir staff con asignación activa en otro partido a la misma hora. */
  excludeBusy?: boolean;
}

/**
 * Devuelve la lista de staff disponibles en un horario dado.
 *
 * Cruzar:
 * 1. `StaffAvailability` (dayOfWeek + slot que cubra el time).
 * 2. Staff activos y no borrados.
 * 3. (Opcional, default true) Excluir staff con `MatchStaff` en otro partido
 *    en estados activos a la misma fecha+hora.
 */
@Injectable()
export class FindAvailableStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly staffRepo: IStaffRepository,
    @Inject(STAFF_AVAILABILITY_REPOSITORY)
    private readonly availRepo: IStaffAvailabilityRepository,
    @Inject(MATCH_STAFF_REPOSITORY)
    private readonly matchStaffRepo: IMatchStaffRepository,
  ) {}

  async execute(input: FindAvailableStaffInput): Promise<StaffRow[]> {
    const dayOfWeek = input.date.getDay();
    const time = formatTime(input.date);

    const staffIds = await this.availRepo.findStaffAvailableAt({
      dayOfWeek,
      time,
      type: input.type,
    });

    if (staffIds.length === 0) return [];

    // Cargar entidades completas (también valida isActive=true y deletedAt=null).
    const allRows = await Promise.all(staffIds.map((id) => this.staffRepo.findById(id)));
    const rows = allRows.filter(
      (s): s is StaffRow => s !== null && s.isActive && s.deletedAt === null,
    );

    if (input.excludeBusy === false) {
      return rows;
    }

    // Filtrar los que tienen un partido en conflicto en la misma fecha+hora.
    const filtered: StaffRow[] = [];
    for (const staff of rows) {
      const conflict = await this.matchStaffRepo.findConflictingAssignment({
        staffId: staff.id,
        matchDate: input.date,
        matchTime: time,
      });
      if (!conflict) {
        filtered.push(staff);
      }
    }

    return filtered;
  }
}

function formatTime(d: Date): string {
  // Devuelve HH:mm en hora local del proceso. Coincidente con cómo Match guarda matchTime.
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
