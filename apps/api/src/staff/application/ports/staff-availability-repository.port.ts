import { AvailabilityRow } from './staff-repository.port';

export interface AvailabilitySlotInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface IStaffAvailabilityRepository {
  /**
   * Reemplaza por completo la disponibilidad del staff.
   * Internamente: borra todas las franjas existentes y crea las nuevas en una transacción.
   */
  replaceForStaff(
    staffId: string,
    slots: AvailabilitySlotInput[],
  ): Promise<AvailabilityRow[]>;

  findByStaff(staffId: string): Promise<AvailabilityRow[]>;

  /**
   * Devuelve los staff que tienen disponibilidad para `dayOfWeek` y cuyo slot
   * cubre la `time` (HH:mm). Filtros opcionales: `type` y solo activos.
   */
  findStaffAvailableAt(input: {
    dayOfWeek: number;
    time: string;
    type?: string;
  }): Promise<string[]>; // staff IDs
}

export const STAFF_AVAILABILITY_REPOSITORY = Symbol(
  'STAFF_AVAILABILITY_REPOSITORY',
);
