export const STAFF_CHECK_PORT = Symbol('STAFF_CHECK_PORT');

/**
 * Puerto para chequear staff confirmado de un partido (RN-049).
 *
 * Cuenta `MatchStaff.status='assigned'` agrupado por `role`. La
 * implementación accede a Prisma directo — `StaffService` no expone una
 * facade pública para esto y no queremos importar todo el módulo.
 */
export interface IStaffCheckPort {
  countConfirmedStaff(matchId: string): Promise<{
    referees: number;
    tableOfficials: number;
  }>;
}
