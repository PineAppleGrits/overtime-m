/**
 * Reglas puras de validación de DNI / documento de identidad.
 *
 * - RN-034 — DNI verificado obligatorio para crear equipo.
 * - RN-035 — DNI es nexo con registros previos sin cuenta.
 * - RN-036 — DNI verificado por foto.
 *
 * Mantenemos las reglas puras (sin Prisma ni IO) para tests de unidad
 * triviales.
 */

const ARGENTINIAN_DNI_REGEX = /^\d{7,9}$/;

export interface DniNormalizationResult {
  /** Documento normalizado (sin puntos, espacios, guiones). */
  normalized: string;
  isValid: boolean;
}

/**
 * Normaliza un número de documento argentino: remueve puntos, espacios y
 * guiones; valida que sean 7-9 dígitos. Retorna la forma canónica + flag.
 */
export function normalizeDocumentNumber(input: string): DniNormalizationResult {
  if (!input) return { normalized: '', isValid: false };
  const cleaned = input
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '');
  return {
    normalized: cleaned,
    isValid: ARGENTINIAN_DNI_REGEX.test(cleaned),
  };
}

export function isValidDocumentNumber(input: string): boolean {
  return normalizeDocumentNumber(input).isValid;
}

const ALLOWED_DNI_PHOTO_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export const DNI_PHOTO_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function isAcceptedDniPhotoContentType(contentType: string): boolean {
  return ALLOWED_DNI_PHOTO_CONTENT_TYPES.has(contentType.toLowerCase());
}

export function isAcceptedDniPhotoSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= DNI_PHOTO_MAX_SIZE_BYTES;
}
