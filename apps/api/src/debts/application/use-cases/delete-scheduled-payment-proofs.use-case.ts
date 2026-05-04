import { Injectable, Logger } from '@nestjs/common';
import { MediaCategory } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { MediaAssetService } from '../../../common/storage';

export interface DeleteScheduledProofsInput {
  now?: Date;
  /** Cap por corrida. */
  take?: number;
}

export interface DeleteScheduledProofsOutput {
  scannedCount: number;
  deletedCount: number;
  errors: Array<{ assetId: string; error: string }>;
}

/**
 * Cron RN-060 — Borrado automático de comprobantes de transferencia.
 *
 * Lista `MediaAsset` con:
 * - `category = PAYMENT_PROOF`
 * - `scheduledDeletionAt < now`
 * - `deletedAt is null`
 *
 * Por cada uno llama a `MediaAssetService.delete(id)` que hace soft-delete del
 * registro + delete físico en Supabase. Si el storage falla, el delete del
 * registro se preserva (el job no rompe).
 *
 * Idempotencia: el filtro `deletedAt is null` ya evita re-procesar.
 *
 * Notas:
 * - La programación del `scheduledDeletionAt` la hace W2.2 (PaymentsService)
 *   cuando el admin aprueba un pago de transferencia. Acá sólo el job que
 *   ejecuta el borrado.
 */
@Injectable()
export class DeleteScheduledPaymentProofsUseCase {
  private readonly logger = new Logger(
    DeleteScheduledPaymentProofsUseCase.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaAssets: MediaAssetService,
  ) {}

  async execute(
    input: DeleteScheduledProofsInput = {},
  ): Promise<DeleteScheduledProofsOutput> {
    const now = input.now ?? new Date();
    const take = input.take ?? 500;

    const candidates = await this.prisma.mediaAsset.findMany({
      where: {
        category: MediaCategory.PAYMENT_PROOF,
        deletedAt: null,
        scheduledDeletionAt: { not: null, lt: now },
      },
      select: { id: true },
      take,
    });

    let deletedCount = 0;
    const errors: Array<{ assetId: string; error: string }> = [];

    for (const asset of candidates) {
      try {
        await this.mediaAssets.delete(asset.id);
        deletedCount += 1;
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Error borrando MediaAsset ${asset.id}: ${error.message}`,
          error.stack,
        );
        errors.push({ assetId: asset.id, error: error.message });
      }
    }

    this.logger.log(
      `Delete scheduled payment proofs — scanned=${candidates.length}, deleted=${deletedCount}, errors=${errors.length}`,
    );

    return {
      scannedCount: candidates.length,
      deletedCount,
      errors,
    };
  }
}
