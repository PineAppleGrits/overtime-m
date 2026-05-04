import { MediaAsset } from '@prisma/client';

/**
 * Puerto para subir / programar borrado / consultar comprobantes de pago.
 * Wrapping fino sobre `MediaAssetService` (PR0) — el use-case habla con el
 * port y no se acopla al detalle del servicio.
 */
export interface UploadProofInput {
  paymentId: string;
  uploadedByProfileId: string;
  contentType: string;
  originalFilename: string;
  body: Buffer;
}

export interface IProofStoragePort {
  upload(input: UploadProofInput): Promise<MediaAsset>;
  /**
   * Devuelve el último comprobante subido para un payment (si existe).
   * Filtro: `category=PAYMENT_PROOF` + `metadata.paymentId === paymentId`
   * + `deletedAt IS NULL`. Ordena por `createdAt desc`.
   */
  findLatestForPayment(paymentId: string): Promise<MediaAsset | null>;
  /**
   * Programa el borrado físico para `deleteAt`. Idempotente: pisa el campo.
   */
  scheduleDeletion(assetId: string, deleteAt: Date): Promise<void>;
}

export const PROOF_STORAGE_PORT = Symbol('PROOF_STORAGE_PORT');
