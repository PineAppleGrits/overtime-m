import {
  MediaAsset,
  MediaCategory,
  MediaVisibility,
} from '@prisma/client';
import { ErrorCode } from '../../../common/errors';
import {
  IPaymentRepository,
  PaymentWithRelations,
} from '../ports/payment-repository.port';
import { IProofStoragePort } from '../ports/proof-storage.port';
import { UploadPaymentProofUseCase } from './upload-payment-proof.use-case';

const buildPayment = (
  override: Partial<PaymentWithRelations> = {},
): PaymentWithRelations =>
  ({
    id: 'p-1',
    debtId: null,
    registrationId: null,
    matchId: null,
    profileId: 'profile-1',
    amount: 5000,
    currency: 'ARS',
    method: 'transferencia',
    status: 'pendiente',
    providerPaymentId: null,
    providerResponse: null,
    processedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { id: 'profile-1', name: 'X', email: null },
    registration: null,
    match: null,
    debt: null,
    ...override,
  }) as PaymentWithRelations;

const makeAsset = (): MediaAsset => ({
  id: 'asset-1',
  bucket: 'private',
  storageKey: 'payment-proofs/p-1/abc.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1024,
  sha256: 'abc',
  originalFilename: 'comp.pdf',
  uploadedByProfileId: 'profile-1',
  visibility: MediaVisibility.PRIVATE,
  category: MediaCategory.PAYMENT_PROOF,
  metadata: { paymentId: 'p-1' } as never,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  scheduledDeletionAt: null,
});

const makeRepo = (p: PaymentWithRelations): jest.Mocked<IPaymentRepository> =>
  ({
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(p),
    findByProviderExternalReference: jest.fn(),
    findActiveForResource: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    getSummary: jest.fn(),
  }) as unknown as jest.Mocked<IPaymentRepository>;

const makeProofs = (): jest.Mocked<IProofStoragePort> =>
  ({
    upload: jest.fn().mockResolvedValue(makeAsset()),
    findLatestForPayment: jest.fn(),
    scheduleDeletion: jest.fn(),
  }) as unknown as jest.Mocked<IProofStoragePort>;

describe('UploadPaymentProofUseCase', () => {
  it('sube comprobante PDF para transferencia pendiente', async () => {
    const repo = makeRepo(buildPayment());
    const proofs = makeProofs();
    const uc = new UploadPaymentProofUseCase(repo, proofs);

    const asset = await uc.execute({
      paymentId: 'p-1',
      uploadedByProfileId: 'profile-1',
      contentType: 'application/pdf',
      originalFilename: 'comp.pdf',
      body: Buffer.from('hello world'),
    });

    expect(asset.id).toBe('asset-1');
    expect(proofs.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'p-1',
        uploadedByProfileId: 'profile-1',
        contentType: 'application/pdf',
      }),
    );
  });

  it('rechaza si el pago no es transferencia (RN-014)', async () => {
    const repo = makeRepo(buildPayment({ method: 'cash' }));
    const proofs = makeProofs();
    const uc = new UploadPaymentProofUseCase(repo, proofs);

    await expect(
      uc.execute({
        paymentId: 'p-1',
        uploadedByProfileId: 'profile-1',
        contentType: 'application/pdf',
        originalFilename: 'c.pdf',
        body: Buffer.from('x'),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.PAYMENT_METHOD_INVALID });
  });

  it('rechaza si el pago ya está procesado', async () => {
    const repo = makeRepo(buildPayment({ status: 'procesado' }));
    const uc = new UploadPaymentProofUseCase(repo, makeProofs());

    await expect(
      uc.execute({
        paymentId: 'p-1',
        uploadedByProfileId: 'profile-1',
        contentType: 'application/pdf',
        originalFilename: 'c.pdf',
        body: Buffer.from('x'),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });

  it('rechaza tipos de archivo no permitidos', async () => {
    const repo = makeRepo(buildPayment());
    const uc = new UploadPaymentProofUseCase(repo, makeProofs());

    await expect(
      uc.execute({
        paymentId: 'p-1',
        uploadedByProfileId: 'profile-1',
        contentType: 'application/zip',
        originalFilename: 'c.zip',
        body: Buffer.from('x'),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });

  it('rechaza body vacío con PAYMENT_PROOF_REQUIRED', async () => {
    const repo = makeRepo(buildPayment());
    const uc = new UploadPaymentProofUseCase(repo, makeProofs());

    await expect(
      uc.execute({
        paymentId: 'p-1',
        uploadedByProfileId: 'profile-1',
        contentType: 'application/pdf',
        originalFilename: 'c.pdf',
        body: Buffer.alloc(0),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.PAYMENT_PROOF_REQUIRED });
  });
});
