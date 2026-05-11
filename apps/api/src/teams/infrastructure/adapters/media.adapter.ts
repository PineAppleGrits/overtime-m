import { Injectable } from '@nestjs/common';
import type { MediaAsset, MediaCategory, MediaVisibility } from '@prisma/client';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import type { TeamMediaPort } from '../../application/ports/team-media.port';

@Injectable()
export class TeamMediaAdapter implements TeamMediaPort {
  constructor(private readonly mediaAssets: MediaAssetService) {}

  async upload(params: {
    uploadedByProfileId: string;
    category: MediaCategory;
    visibility: MediaVisibility;
    contentType: string;
    originalFilename: string;
    body: Buffer;
    pathPrefix: string;
    metadata: Record<string, string>;
  }): Promise<MediaAsset> {
    return this.mediaAssets.upload(params);
  }

  async delete(assetId: string): Promise<void> {
    await this.mediaAssets.delete(assetId);
  }

  async getAccessUrl(asset: MediaAsset): Promise<string> {
    return this.mediaAssets.getAccessUrl(asset);
  }
}

