import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BlacklistEntry, MediaCategory, MediaVisibility } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import {
  BLACKLIST_REPOSITORY,
  IBlacklistRepository,
} from '../ports/blacklist-repository.port';

export interface UploadBlacklistAttachmentInput {
  blacklistId: string;
  uploadedByProfileId: string;
  contentType: string;
  originalFilename: string;
  body: Buffer;
}

@Injectable()
export class UploadBlacklistAttachmentUseCase {
  private readonly logger = new Logger(UploadBlacklistAttachmentUseCase.name);

  constructor(
    @Inject(BLACKLIST_REPOSITORY)
    private readonly repo: IBlacklistRepository,
    private readonly mediaAssets: MediaAssetService,
  ) {}

  async execute(
    input: UploadBlacklistAttachmentInput,
  ): Promise<{ blacklist: BlacklistEntry; assetId: string; url: string }> {
    const blacklist = await this.repo.findById(input.blacklistId);
    if (!blacklist) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Entrada de blacklist no encontrada',
        HttpStatus.NOT_FOUND,
        { blacklistId: input.blacklistId },
      );
    }

    const asset = await this.mediaAssets.upload({
      uploadedByProfileId: input.uploadedByProfileId,
      category: MediaCategory.BLACKLIST_ATTACHMENT,
      visibility: MediaVisibility.PRIVATE,
      contentType: input.contentType,
      originalFilename: input.originalFilename,
      body: input.body,
      metadata: { blacklistId: input.blacklistId },
      pathPrefix: `blacklists/${input.blacklistId}`,
    });

    const url = await this.mediaAssets.getAccessUrl(asset);
    const updated = await this.repo.addAttachmentUrl(input.blacklistId, url);

    this.logger.log(
      `Adjunto cargado en blacklist ${input.blacklistId}: asset=${asset.id}`,
    );

    return { blacklist: updated, assetId: asset.id, url };
  }
}
