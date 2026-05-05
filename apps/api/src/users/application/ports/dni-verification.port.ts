/**
 * Puerto de verificación automática de DNI por foto.
 *
 * RN-036 — el sistema lee la foto del DNI y valida que sea legítimo.
 * DP-009 — todavía no decidimos el mecanismo (OCR + IA, lector físico, mix).
 *
 * El stub actual retorna `requiresManualReview=true` siempre. Cuando se
 * defina la estrategia, se cambia el adapter sin tocar use-cases.
 */
export interface DniVerificationInput {
  profileId: string;
  /** ID del MediaAsset con la foto de DNI subida. */
  assetId: string;
}

export interface DniVerificationResult {
  /** True si la verificación automática completó OK. */
  verified: boolean;
  /** Documento extraído de la foto (si aplica). Sólo si verified=true. */
  extractedDocumentNumber?: string;
  /** Si true, debe revisar un admin manualmente. */
  requiresManualReview: boolean;
  /** Razón opcional para debug / log. */
  reason?: string;
}

export interface IDniVerificationPort {
  verify(input: DniVerificationInput): Promise<DniVerificationResult>;
}

export const DNI_VERIFICATION_PORT = Symbol('DNI_VERIFICATION_PORT');
