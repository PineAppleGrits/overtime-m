import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  MediaAsset,
  MediaCategory,
  MediaVisibility,
} from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import { PrismaService } from '../../../database/prisma.service';
import { defaultValidUntilForYear } from '../../domain/rules/medical-cert-validity.rules';

export interface UploadMedicalCertInput {
  profileId: string;
  uploadedByProfileId: string;
  contentType: string;
  originalFilename: string;
  body: Buffer;
  /** Año de validez. Default: año actual. */
  year?: number;
}

/**
 * RN-008 — Sube apto médico. Crea MediaAsset privado con metadata
 * `{ profileId, year, validUntil: 'YYYY-12-31' }` y actualiza el puntero
 * `Profile.currentMedicalAssetId`. NO sobreescribe los assets viejos — quedan
 * como histórico (consultar via `MediaAsset` por `(profileId, category)`).
 */
@Injectable()
export class UploadMedicalCertUseCase {
  private readonly logger = new Logger(UploadMedicalCertUseCase.name);

  constructor(
    private readonly mediaAssets: MediaAssetService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: UploadMedicalCertInput): Promise<MediaAsset> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: input.profileId, deletedAt: null },
      select: { id: true },
    });
    if (!profile) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Perfil no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const year = input.year ?? new Date().getUTCFullYear();
    const validUntil = defaultValidUntilForYear(year);

    const asset = await this.mediaAssets.upload({
      uploadedByProfileId: input.uploadedByProfileId,
      category: MediaCategory.MEDICAL_CERT,
      visibility: MediaVisibility.PRIVATE,
      contentType: input.contentType,
      originalFilename: input.originalFilename,
      body: input.body,
      metadata: { profileId: profile.id, year, validUntil },
      pathPrefix: `medical-cert/${profile.id}/${year}`,
    });

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { currentMedicalAssetId: asset.id },
    });

    const payload: DomainEventPayloads['medical-cert.uploaded'] = {
      profileId: profile.id,
      assetId: asset.id,
      year,
      validUntil,
    };
    this.eventEmitter.emit(DomainEvent.MEDICAL_CERT_UPLOADED, payload);

    this.logger.log(
      `Apto médico subido: profile=${profile.id} asset=${asset.id} year=${year}`,
    );
    return asset;
  }
}
