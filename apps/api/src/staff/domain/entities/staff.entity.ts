import { computeAjcFee } from '../rules/ajc-formula.rules';

/**
 * Tipo de rol de un staff. Mapea 1:1 con `MatchStaff.role`.
 */
export type StaffTypeValue = 'referee' | 'table_official' | 'photographer';

export interface StaffState {
  id: string;
  profileId: string | null;
  type: StaffTypeValue;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Entidad de dominio Staff. Encapsula reglas de asignación, role-matching y
 * la fórmula de AJC (RN-030, vinculada al staff "árbitro" pero usable como
 * cálculo puro desde cualquier caller).
 *
 * Decisión: el sueldo del árbitro NO vive en este modelo (no hay schema). Es
 * un input externo al use-case que llame `computeAjcFee`. Aquí solo exponemos
 * el método para conveniencia/cohesión.
 */
export class Staff {
  private constructor(private readonly state: StaffState) {}

  static fromState(state: StaffState): Staff {
    return new Staff(state);
  }

  get id(): string {
    return this.state.id;
  }

  get type(): StaffTypeValue {
    return this.state.type;
  }

  get isActive(): boolean {
    return this.state.isActive;
  }

  get isDeleted(): boolean {
    return this.state.deletedAt !== null;
  }

  toState(): StaffState {
    return { ...this.state };
  }

  /**
   * Indica si este staff puede ser asignado a un partido con el rol pedido.
   * Reglas:
   * - El staff no debe estar borrado (`deletedAt = null`).
   * - El staff debe estar activo.
   * - El `type` del staff debe coincidir con el `role` solicitado.
   */
  canBeAssignedToMatch(role: StaffTypeValue): boolean {
    if (this.isDeleted) return false;
    if (!this.state.isActive) return false;
    return this.state.type === role;
  }

  /**
   * RN-030 — Cálculo del monto AJC para este árbitro.
   *
   * No hay sueldo persistido (decisión: se pasa como input). Este método queda
   * como conveniencia para mantener cohesión: el caller pasa el sueldo como
   * parámetro y obtiene el monto.
   */
  computeAjcAmount(refereeSalary: number, fechasToFree: number): number {
    return computeAjcFee(refereeSalary, fechasToFree);
  }
}
