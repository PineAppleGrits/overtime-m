import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { MediaCategory, MediaVisibility } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import { Sanction } from '../../domain/entities/sanction.entity';
import {
  ISanctionRepository,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

export interface UploadSanctionAttachmentInput {
  sanctionId: string;
  uploadedByProfileId: string;
  contentType: string;
  originalFilename: string;
  body: Buffer;
}

@Injectable()
export class UploadSanctionAttachmentUseCase {
  private readonly logger = new Logger(UploadSanctionAttachmentUseCase.name);

  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
    private readonly mediaAssets: MediaAssetService,
  ) {}

  async execute(
    input: UploadSanctionAttachmentInput,
  ): Promise<{ sanction: Sanction; assetId: string; url: string }> {
    const sanction = await this.repo.findById(input.sanctionId);
    if (!sanction) {
      throw new BusinessError(
        ErrorCode.SANCTION_NOT_FOUND,
        'Sanción no encontrada',
        HttpStatus.NOT_FOUND,
        { sanctionId: input.sanctionId },
      );
    }

    const asset = await this.mediaAssets.upload({
      uploadedByProfileId: input.uploadedByProfileId,
      category: MediaCategory.SANCTION_ATTACHMENT,
      visibility: MediaVisibility.PRIVATE,
      contentType: input.contentType,
      originalFilename: input.originalFilename,
      body: input.body,
      metadata: { sanctionId: input.sanctionId },
      pathPrefix: `sanctions/${input.sanctionId}`,
    });

    const url = await this.mediaAssets.getAccessUrl(asset);
    const updated = await this.repo.addAttachmentUrl(input.sanctionId, url);

    this.logger.log(
      `Adjunto cargado en sanción ${input.sanctionId}: asset=${asset.id}`,
    );

    return { sanction: updated, assetId: asset.id, url };
  }
}
