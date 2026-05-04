export type MediaVisibility = 'PUBLIC' | 'PRIVATE';

export type MediaCategory =
  | 'AVATAR'
  | 'TEAM_LOGO'
  | 'FRANCHISE_LOGO'
  | 'TOURNAMENT_BANNER'
  | 'PAYMENT_PROOF'
  | 'MEDICAL_CERT'
  | 'SWORN_STATEMENT'
  | 'DNI_PHOTO'
  | 'SANCTION_ATTACHMENT'
  | 'BLACKLIST_ATTACHMENT'
  | 'OTHER';

export interface MediaAssetDto {
  id: string;
  bucket: string;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  originalFilename: string;
  uploadedByProfileId: string;
  visibility: MediaVisibility;
  category: MediaCategory;
  metadata: Record<string, unknown> | null;
  scheduledDeletionAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Respuesta del endpoint que entrega una URL accesible para un asset.
 * - Para assets públicos, `signedUrl` es una URL directa (no expira).
 * - Para assets privados, `signedUrl` es signed con TTL.
 */
export interface MediaAccessUrlDto {
  assetId: string;
  url: string;
  expiresAt: string | null; // null si es público
}
