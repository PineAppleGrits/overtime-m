import { MediaCategory, MediaVisibility } from '@prisma/client';
import { BusinessError } from '../../../common/errors';
import { MediaAssetService } from '../../../common/storage/media-asset.service';
import { IBlacklistRepository } from '../ports/blacklist-repository.port';
import { UploadBlacklistAttachmentUseCase } from './upload-blacklist-attachment.use-case';

const makeRepo = (): jest.Mocked<IBlacklistRepository> =>
  ({
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    lift: jest.fn(),
    addAttachmentUrl: jest.fn(),
    hasActiveEntry: jest.fn(),
    findActive: jest.fn(),
    deactivateProfileMemberships: jest.fn(),
  }) as unknown as jest.Mocked<IBlacklistRepository>;

const makeMediaAssets = (): jest.Mocked<MediaAssetService> =>
  ({
    upload: jest.fn(),
    getAccessUrl: jest.fn(),
  }) as unknown as jest.Mocked<MediaAssetService>;

describe('UploadBlacklistAttachmentUseCase', () => {
  it('sube asset privado BLACKLIST_ATTACHMENT y agrega la URL a la entry', async () => {
    const repo = makeRepo();
    const mediaAssets = makeMediaAssets();
    repo.findById.mockResolvedValue({
      id: 'bl-1',
      profileId: 'p-1',
      documentNumber: '123',
      profileNameSnapshot: 'Jugador',
      reason: 'Motivo',
      attachmentUrls: [],
      blockedByProfileId: 'admin-1',
      blockedAt: new Date(),
      status: 'ACTIVE',
      liftedByProfileId: null,
      liftedAt: null,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mediaAssets.upload.mockResolvedValue({
      id: 'asset-1',
      bucket: 'private',
      storageKey: 'blacklists/bl-1/file.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
      sha256: 'hash',
      originalFilename: 'file.pdf',
      uploadedByProfileId: 'admin-1',
      visibility: MediaVisibility.PRIVATE,
      category: MediaCategory.BLACKLIST_ATTACHMENT,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      scheduledDeletionAt: null,
    });
    mediaAssets.getAccessUrl.mockResolvedValue(
      'https://signed-url.test/file.pdf',
    );
    repo.addAttachmentUrl.mockResolvedValue({
      id: 'bl-1',
      profileId: 'p-1',
      documentNumber: '123',
      profileNameSnapshot: 'Jugador',
      reason: 'Motivo',
      attachmentUrls: ['https://signed-url.test/file.pdf'],
      blockedByProfileId: 'admin-1',
      blockedAt: new Date(),
      status: 'ACTIVE',
      liftedByProfileId: null,
      liftedAt: null,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const useCase = new UploadBlacklistAttachmentUseCase(repo, mediaAssets);

    const result = await useCase.execute({
      blacklistId: 'bl-1',
      uploadedByProfileId: 'admin-1',
      contentType: 'application/pdf',
      originalFilename: 'file.pdf',
      body: Buffer.from('pdf'),
    });

    expect(mediaAssets.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadedByProfileId: 'admin-1',
        category: MediaCategory.BLACKLIST_ATTACHMENT,
        visibility: MediaVisibility.PRIVATE,
        metadata: { blacklistId: 'bl-1' },
        pathPrefix: 'blacklists/bl-1',
      }),
    );
    expect(repo.addAttachmentUrl).toHaveBeenCalledWith(
      'bl-1',
      'https://signed-url.test/file.pdf',
    );
    expect(result.assetId).toBe('asset-1');
  });

  it('falla con NOT_FOUND si la blacklist no existe', async () => {
    const repo = makeRepo();
    const mediaAssets = makeMediaAssets();
    repo.findById.mockResolvedValue(null);

    const useCase = new UploadBlacklistAttachmentUseCase(repo, mediaAssets);

    await expect(
      useCase.execute({
        blacklistId: 'missing',
        uploadedByProfileId: 'admin-1',
        contentType: 'application/pdf',
        originalFilename: 'file.pdf',
        body: Buffer.from('pdf'),
      }),
    ).rejects.toBeInstanceOf(BusinessError);
    expect(mediaAssets.upload).not.toHaveBeenCalled();
  });
});
