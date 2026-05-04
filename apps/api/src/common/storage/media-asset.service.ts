import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import {
  MediaAsset,
  MediaCategory,
  MediaVisibility,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseStorageService } from './supabase-storage.service';
import {
  DEFAULT_SIGNED_URL_TTL_SECONDS,
  PRIVATE_BUCKET,
  PUBLIC_BUCKET,
} from './storage.constants';

export interface UploadAssetInput {
  uploadedByProfileId: string;
  category: MediaCategory;
  visibility: MediaVisibility;
  contentType: string;
  originalFilename: string;
  body: Buffer;
  metadata?: Record<string, unknown>;
  /**
   * Subdir/prefijo dentro del bucket. Útil para organizar archivos por entidad.
   * Ej: `payment-proofs/${debtId}` → key final: `payment-proofs/${debtId}/${uuid}`.
   * Si no se pasa, se usa la categoría en lowercase como prefijo.
   */
  pathPrefix?: string;
}

export interface AccessUrlOptions {
  /**
   * TTL para signed URLs en buckets privados. Ignorado para públicos.
   */
  ttlSeconds?: number;
}

/**
 * Servicio de alto nivel para gestionar archivos. Combina storage físico
 * (Supabase) con el registro `MediaAsset` (auditoría, integridad, lifecycle).
 *
 * Reglas:
 * - Visibility PUBLIC → bucket público, URL directa, sin signed URL.
 * - Visibility PRIVATE → bucket privado, siempre signed URL.
 * - Cada upload genera un sha256 que se guarda en MediaAsset (RN-008
 *   integridad, sanciones, comprobantes).
 */
@Injectable()
export class MediaAssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async upload(input: UploadAssetInput): Promise<MediaAsset> {
    const bucket =
      input.visibility === MediaVisibility.PUBLIC
        ? PUBLIC_BUCKET
        : PRIVATE_BUCKET;
    const sha256 = createHash('sha256').update(input.body).digest('hex');
    const ext = guessExtension(input.contentType, input.originalFilename);
    const prefix = input.pathPrefix ?? input.category.toLowerCase();
    const storageKey = `${prefix}/${randomUUID()}${ext}`;

    await this.storage.upload({
      bucket,
      storageKey,
      body: input.body,
      contentType: input.contentType,
    });

    return this.prisma.mediaAsset.create({
      data: {
        bucket,
        storageKey,
        contentType: input.contentType,
        sizeBytes: input.body.byteLength,
        sha256,
        originalFilename: input.originalFilename,
        uploadedByProfileId: input.uploadedByProfileId,
        visibility: input.visibility,
        category: input.category,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findById(id: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }

  /**
   * Devuelve URL accesible para el asset.
   * - PUBLIC: URL directa.
   * - PRIVATE: signed URL con TTL.
   */
  async getAccessUrl(
    asset: Pick<MediaAsset, 'bucket' | 'storageKey' | 'visibility'>,
    options: AccessUrlOptions = {},
  ): Promise<string> {
    if (asset.visibility === MediaVisibility.PUBLIC) {
      return this.storage.getPublicUrl(asset.bucket, asset.storageKey);
    }
    return this.storage.getSignedUrl(
      asset.bucket,
      asset.storageKey,
      options.ttlSeconds ?? DEFAULT_SIGNED_URL_TTL_SECONDS,
    );
  }

  /**
   * Soft-delete del registro + delete físico en Supabase.
   * Usar para borrados manuales (admin) o cuando la entidad reemplaza el asset.
   */
  async delete(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.deletedAt) return;

    try {
      await this.storage.delete(asset.bucket, asset.storageKey);
    } catch (err) {
      // Si el storage falla, seguimos con soft-delete del registro y dejamos
      // el archivo huérfano para el cleanup job futuro (v2).
    }

    await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Marca un asset para borrado automático en N días (RN-060).
   * El cron de cleanup lo procesa cuando llega la fecha.
   */
  async scheduleDeletion(id: string, deleteAt: Date): Promise<void> {
    await this.prisma.mediaAsset.update({
      where: { id },
      data: { scheduledDeletionAt: deleteAt },
    });
  }
}

function guessExtension(contentType: string, originalFilename: string): string {
  // Preferir extensión del filename original cuando disponible.
  const dotIndex = originalFilename.lastIndexOf('.');
  if (dotIndex > -1 && dotIndex < originalFilename.length - 1) {
    return originalFilename.slice(dotIndex);
  }
  switch (contentType) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '';
  }
}
