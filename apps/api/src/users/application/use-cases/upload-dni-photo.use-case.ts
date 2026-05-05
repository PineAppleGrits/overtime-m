import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  MediaCategory,
  MediaVisibility,
  Profile,
} from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import {
  isAcceptedDniPhotoContentType,
  isAcceptedDniPhotoSize,
  DNI_PHOTO_MAX_SIZE_BYTES,
} from '../../domain/rules/dni-validation.rules';
import {
  DNI_VERIFICATION_PORT,
  IDniVerificationPort,
} from '../ports/dni-verification.port';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from '../ports/profile-repository.port';

export interface UploadDniPhotoInput {
  profileId: string;
  uploadedByProfileId: string;
  contentType: string;
  originalFilename: string;
  body: Buffer;
}

export interface UploadDniPhotoResult {
  profile: Profile;
  assetId: string;
  verified: boolean;
  requiresManualReview: boolean;
}

/**
 * RN-036 — sube la foto de DNI del perfil propio.
 *
 * Flujo:
 * 1. Valida content-type / tamaño.
 * 2. Sube el MediaAsset (categoría DNI_PHOTO, visibility PRIVATE).
 * 3. Setea `dniPhotoAssetId` en Profile, desverifica.
 * 4. Llama al puerto `IDniVerificationPort.verify()`:
 *    - Si retorna verified=true → marca documentVerified, emite PROFILE_DNI_VERIFIED.
 *    - Si retorna requiresManualReview=true → emite PROFILE_DNI_PENDING_REVIEW (admin recibe email).
 */
@Injectable()
export class UploadDniPhotoUseCase {
  private readonly logger = new Logger(UploadDniPhotoUseCase.name);

  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repo: IProfileRepository,
    private readonly mediaAssets: MediaAssetService,
    @Inject(DNI_VERIFICATION_PORT)
    private readonly verifier: IDniVerificationPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: UploadDniPhotoInput): Promise<UploadDniPhotoResult> {
    if (!isAcceptedDniPhotoContentType(input.contentType)) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        `Tipo de archivo no permitido para DNI: ${input.contentType}`,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        { contentType: input.contentType },
      );
    }
    if (!isAcceptedDniPhotoSize(input.body.byteLength)) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'La foto del DNI excede el tamaño máximo permitido',
        HttpStatus.PAYLOAD_TOO_LARGE,
        {
          sizeBytes: input.body.byteLength,
          maxSizeBytes: DNI_PHOTO_MAX_SIZE_BYTES,
        },
      );
    }

    const profile = await this.repo.findById(input.profileId);
    if (!profile) {
      throw new BusinessError(
        ErrorCode.PROFILE_NOT_FOUND,
        'Perfil no encontrado',
        HttpStatus.NOT_FOUND,
        { profileId: input.profileId },
      );
    }

    const asset = await this.mediaAssets.upload({
      uploadedByProfileId: input.uploadedByProfileId,
      category: MediaCategory.DNI_PHOTO,
      visibility: MediaVisibility.PRIVATE,
      contentType: input.contentType,
      originalFilename: input.originalFilename,
      body: input.body,
      pathPrefix: `dni-photos/${input.profileId}`,
      metadata: { profileId: input.profileId },
    });

    const updatedProfile = await this.repo.setDniPhoto(
      input.profileId,
      asset.id,
    );

    let verified = false;
    let requiresManualReview = true;
    let extractedDocument: string | undefined;
    try {
      const result = await this.verifier.verify({
        profileId: input.profileId,
        assetId: asset.id,
      });
      verified = result.verified;
      requiresManualReview = result.requiresManualReview;
      extractedDocument = result.extractedDocumentNumber;
    } catch (err) {
      const e = err as Error;
      this.logger.warn(
        `Verificación automática de DNI falló para profile=${input.profileId}: ${e.message}`,
      );
    }

    if (verified && extractedDocument) {
      await this.repo.markDocumentVerified({
        profileId: input.profileId,
        documentNumber: extractedDocument,
        verifiedBy: 'system:auto-verifier',
      });
      this.eventEmitter.emit(DomainEvent.PROFILE_DNI_VERIFIED, {
        profileId: input.profileId,
        documentNumber: extractedDocument,
        verifiedBy: 'system:auto-verifier',
      } satisfies DomainEventPayloads['profile.dni.verified']);
    } else if (requiresManualReview) {
      this.eventEmitter.emit(DomainEvent.PROFILE_DNI_PENDING_REVIEW, {
        profileId: input.profileId,
        assetId: asset.id,
      } satisfies DomainEventPayloads['profile.dni.pendingReview']);
    }

    return {
      profile: updatedProfile,
      assetId: asset.id,
      verified,
      requiresManualReview,
    };
  }
}
