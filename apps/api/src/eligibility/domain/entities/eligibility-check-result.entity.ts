/**
 * Resultado consolidado de un check de elegibilidad.
 *
 * Cada use-case de eligibility ejecuta múltiples validaciones puras y agrega
 * razones (`reasons`) cuando una condición falla. Si no hay razones, el sujeto
 * (jugador o equipo) es elegible.
 */
export interface EligibilityReason {
  /** Código estable que el FE puede matchear (ej. PROFILE_MEDICAL_CERT_EXPIRED). */
  code: string;
  /** Mensaje en español. */
  message: string;
  /** Identificador opcional del recurso que dispara el bloqueo (ej. sanctionId). */
  sourceId?: string;
  /** Tipo del bloqueo (ej. 'SANCTION', 'BLACKLIST', 'DEBT', 'MEDICAL_CERT'). */
  type?: string;
}

export class EligibilityCheckResult {
  private readonly _reasons: EligibilityReason[];

  constructor(reasons: EligibilityReason[] = []) {
    this._reasons = [...reasons];
  }

  static eligible(): EligibilityCheckResult {
    return new EligibilityCheckResult();
  }

  static fromReasons(reasons: EligibilityReason[]): EligibilityCheckResult {
    return new EligibilityCheckResult(reasons);
  }

  add(reason: EligibilityReason): void {
    this._reasons.push(reason);
  }

  merge(other: EligibilityCheckResult): void {
    for (const reason of other._reasons) {
      this._reasons.push(reason);
    }
  }

  isEligible(): boolean {
    return this._reasons.length === 0;
  }

  getReasons(): EligibilityReason[] {
    return [...this._reasons];
  }

  /** Versión simple para los endpoints `{ eligible, reasons: string[] }`. */
  toSimpleResponse(): { eligible: boolean; reasons: string[] } {
    return {
      eligible: this.isEligible(),
      reasons: this._reasons.map((reason) => reason.message),
    };
  }

  /** Versión rica para clientes que necesitan el detalle. */
  toDetailedResponse(): {
    eligible: boolean;
    reasons: EligibilityReason[];
  } {
    return {
      eligible: this.isEligible(),
      reasons: this.getReasons(),
    };
  }
}
