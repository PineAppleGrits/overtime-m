import type { MediaAsset, MediaCategory, MediaVisibility } from '@prisma/client';

export const TEAM_MEDIA_PORT = Symbol('TEAM_MEDIA_PORT');

export interface TeamMediaPort {
  upload(params: {
    uploadedByProfileId: string;
    category: MediaCategory;
    visibility: MediaVisibility;
    contentType: string;
    originalFilename: string;
    body: Buffer;
    pathPrefix: string;
    metadata: Record<string, string>;
  }): Promise<MediaAsset>;
  delete(assetId: string): Promise<void>;
  getAccessUrl(asset: MediaAsset): Promise<string>;
}

