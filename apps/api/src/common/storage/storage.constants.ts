/**
 * Storage buckets en Supabase.
 *
 * Decisión arquitectónica (PR0): 2 buckets por privacidad.
 * - PUBLIC_BUCKET → URLs directas con cache CDN. Avatares, logos, banners.
 * - PRIVATE_BUCKET → siempre signed URLs. Comprobantes, docs personales, sanciones.
 */
export const PUBLIC_BUCKET = 'public';
export const PRIVATE_BUCKET = 'private';

/**
 * TTL por defecto para signed URLs de archivos privados, en segundos.
 *
 * Decisión PR0: 1 hora uniforme. El FE pide signed URL on-demand al
 * mostrar el archivo; 1h cubre visualización + descarga.
 */
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Días que un comprobante de transferencia (PAYMENT_PROOF) permanece en
 * storage tras la aprobación admin antes de borrarse (RN-060).
 */
export const PAYMENT_PROOF_RETENTION_DAYS = 3;
