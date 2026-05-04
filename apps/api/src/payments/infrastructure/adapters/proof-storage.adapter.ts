import { Injectable } from '@nestjs/common';
import { MediaAsset, MediaCategory, MediaVisibility } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import {
  IProofStoragePort,
  UploadProofInput,
} from '../../application/ports/proof-storage.port';

/**
 * Adapter del puerto `IProofStoragePort` sobre `MediaAssetService` (PR0).
 */
@Injectable()
export class ProofStorageAdapter implements IProofStoragePort {
  constructor(
    private readonly mediaAssets: MediaAssetService,
    private readonly prisma: PrismaService,
  ) {}

  upload(input: UploadProofInput): Promise<MediaAsset> {
    return this.mediaAssets.upload({
      uploadedByProfileId: input.uploadedByProfileId,
      category: MediaCategory.PAYMENT_PROOF,
      visibility: MediaVisibility.PRIVATE,
      contentType: input.contentType,
      originalFilename: input.originalFilename,
      body: input.body,
      metadata: { paymentId: input.paymentId },
      pathPrefix: `payment-proofs/${input.paymentId}`,
    });
  }

  async findLatestForPayment(paymentId: string): Promise<MediaAsset | null> {
    // Usamos Prisma directamente — `MediaAssetService` no tiene query por
    // metadata todavía. El filtro `metadata.paymentId` se hace via JsonFilter.
    return this.prisma.mediaAsset.findFirst({
      where: {
        category: MediaCategory.PAYMENT_PROOF,
        deletedAt: null,
        metadata: {
          path: ['paymentId'],
          equals: paymentId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async scheduleDeletion(assetId: string, deleteAt: Date): Promise<void> {
    await this.mediaAssets.scheduleDeletion(assetId, deleteAt);
  }
}
