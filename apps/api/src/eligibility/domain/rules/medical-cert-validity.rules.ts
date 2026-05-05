/**
 * RN-008 — Apto médico y declaración jurada anuales.
 *
 * Reglas puras (no dependen de Prisma). Reciben el `MediaAsset` "actual" del
 * profile (puntero `currentMedicalAssetId`/`currentSwornAssetId`) y la fecha
 * "asOf" para evaluar vigencia.
 *
 * Política: la metadata del MediaAsset trae:
 *   - `year: number` (ej. 2026)
 *   - `validUntil: 'YYYY-12-31'` (ISO date string)
 *
 * El asset es válido si `validUntil >= asOfDate`. Si `metadata.validUntil` no
 * existe (assets legacy / mal formateados), se considera **inválido** y se
 * fuerza al usuario a re-subir.
 */

export interface MedicalAssetLike {
  id: string;
  metadata: unknown;
}

function readValidUntil(asset: MedicalAssetLike | null | undefined): Date | null {
  if (!asset) return null;
  const meta = (asset.metadata ?? {}) as Record<string, unknown>;
  const raw = meta.validUntil;
  if (typeof raw !== 'string' || raw.length === 0) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/** Apto médico vigente al `asOfDate`. */
export function isMedicalCertValid(
  asset: MedicalAssetLike | null | undefined,
  asOfDate: Date,
): boolean {
  const validUntil = readValidUntil(asset);
  if (!validUntil) return false;
  // Vigente cuando el "fin de validez" cae igual o después del momento que se pregunta.
  return validUntil.getTime() >= asOfDate.getTime();
}

/** Declaración jurada vigente al `asOfDate`. */
export function isSwornStatementValid(
  asset: MedicalAssetLike | null | undefined,
  asOfDate: Date,
): boolean {
  const validUntil = readValidUntil(asset);
  if (!validUntil) return false;
  return validUntil.getTime() >= asOfDate.getTime();
}

/**
 * Helper para construir el `validUntil` por defecto: fin del año calendario
 * en el que se subió el documento. RN-008.
 */
export function defaultValidUntilForYear(year: number): string {
  return `${year}-12-31`;
}
