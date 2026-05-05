import { HttpStatus, Injectable, Logger } from '@nestjs/common';
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

export interface UploadSwornStatementInput {
  profileId: string;
  uploadedByProfileId: string;
  contentType: string;
  originalFilename: string;
  body: Buffer;
  year?: number;
}

@Injectable()
export class UploadSwornStatementUseCase {
  private readonly logger = new Logger(UploadSwornStatementUseCase.name);

  constructor(
    private readonly mediaAssets: MediaAssetService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: UploadSwornStatementInput): Promise<MediaAsset> {
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
      category: MediaCategory.SWORN_STATEMENT,
      visibility: MediaVisibility.PRIVATE,
      contentType: input.contentType,
      originalFilename: input.originalFilename,
      body: input.body,
      metadata: { profileId: profile.id, year, validUntil },
      pathPrefix: `sworn-statement/${profile.id}/${year}`,
    });

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { currentSwornAssetId: asset.id },
    });

    const payload: DomainEventPayloads['sworn-statement.uploaded'] = {
      profileId: profile.id,
      assetId: asset.id,
      year,
      validUntil,
    };
    this.eventEmitter.emit(DomainEvent.SWORN_STATEMENT_UPLOADED, payload);

    this.logger.log(
      `DDJJ subida: profile=${profile.id} asset=${asset.id} year=${year}`,
    );
    return asset;
  }
}
