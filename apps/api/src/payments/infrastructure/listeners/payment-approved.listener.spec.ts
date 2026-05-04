import {
  MediaAsset,
  MediaCategory,
  MediaVisibility,
} from '@prisma/client';
import { IProofStoragePort } from '../../application/ports/proof-storage.port';
import { PaymentApprovedListener } from './payment-approved.listener';

const buildAsset = (): MediaAsset => ({
  id: 'asset-1',
  bucket: 'private',
  storageKey: 'payment-proofs/p-1/x.pdf',
  contentType: 'application/pdf',
  sizeBytes: 100,
  sha256: 'sha',
  originalFilename: 'x.pdf',
  uploadedByProfileId: 'u',
  visibility: MediaVisibility.PRIVATE,
  category: MediaCategory.PAYMENT_PROOF,
  metadata: { paymentId: 'p-1' } as never,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  scheduledDeletionAt: null,
});

const makeProofs = (): jest.Mocked<IProofStoragePort> =>
  ({
    upload: jest.fn(),
    findLatestForPayment: jest.fn(),
    scheduleDeletion: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<IProofStoragePort>;

describe('PaymentApprovedListener — RN-060', () => {
  it('programa borrado en 3 días para transferencia con comprobante', async () => {
    const proofs = makeProofs();
    proofs.findLatestForPayment.mockResolvedValueOnce(buildAsset());
    const listener = new PaymentApprovedListener(proofs);

    await listener.onPaymentApproved({
      paymentId: 'p-1',
      debtId: 'd-1',
      approvedBy: 'admin-1',
      method: 'transferencia',
    });

    expect(proofs.scheduleDeletion).toHaveBeenCalledTimes(1);
    const [assetId, deleteAt] = proofs.scheduleDeletion.mock.calls[0];
    expect(assetId).toBe('asset-1');
    const diffMs = (deleteAt as Date).getTime() - Date.now();
    // Aproximadamente 3 días = 259_200_000 ms (con tolerancia 1s).
    expect(diffMs).toBeGreaterThanOrEqual(3 * 24 * 60 * 60 * 1000 - 1000);
    expect(diffMs).toBeLessThanOrEqual(3 * 24 * 60 * 60 * 1000 + 1000);
  });

  it('skip si el método es mercadopago', async () => {
    const proofs = makeProofs();
    const listener = new PaymentApprovedListener(proofs);

    await listener.onPaymentApproved({
      paymentId: 'p-1',
      debtId: 'd-1',
      approvedBy: 'mp',
      method: 'mercadopago',
    });
    expect(proofs.findLatestForPayment).not.toHaveBeenCalled();
    expect(proofs.scheduleDeletion).not.toHaveBeenCalled();
  });

  it('skip si no hay comprobante adjunto', async () => {
    const proofs = makeProofs();
    proofs.findLatestForPayment.mockResolvedValueOnce(null);
    const listener = new PaymentApprovedListener(proofs);

    await listener.onPaymentApproved({
      paymentId: 'p-1',
      debtId: null as never,
      approvedBy: 'admin',
      method: 'transferencia',
    });
    expect(proofs.scheduleDeletion).not.toHaveBeenCalled();
  });
});
