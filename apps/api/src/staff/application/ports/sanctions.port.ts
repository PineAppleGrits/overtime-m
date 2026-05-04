/**
 * Port hacia datos de Sanctions necesarios para AJC (RN-030).
 *
 * Decisión: NO depender directamente de un módulo Sanctions (W3.3) — abrimos
 * un port mínimo y el adapter lee/persiste contra la tabla `sanctions` directo
 * via Prisma. Cuando W3.3 madure, el adapter pasa a usar el `SanctionsService`.
 */
export interface SanctionRow {
  id: string;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED';
  kind: 'DISCIPLINARY' | 'MONETARY';
  targetProfileId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  notes: string | null;
}

export interface MarkAjcAppliedInput {
  sanctionId: string;
  fechasFreed: number;
  appliedAt: Date;
  appliedBy: string;
  refereeSalary: number;
  ajcAmount: number;
  ajcDebtId: string;
}

export interface ISanctionsPort {
  findById(id: string): Promise<SanctionRow | null>;

  /**
   * Anota en la sanción que se aplicó un AJC (sin resolverla — la lógica de
   * "fechas restantes" la maneja W3.3 al pagar el debt). Persiste la metadata
   * en el campo `notes` (append) o en un campo JSON cuando exista.
   */
  markAjcApplied(input: MarkAjcAppliedInput): Promise<void>;
}

export const SANCTIONS_PORT = Symbol('SANCTIONS_PORT');
