import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { MediaAsset } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  isValidPaymentMethod,
  normalizeMethod,
  requiresProof,
} from '../../domain/rules/method-validation.rules';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../ports/payment-repository.port';
import {
  IProofStoragePort,
  PROOF_STORAGE_PORT,
} from '../ports/proof-storage.port';

export interface UploadPaymentProofInput {
  paymentId: string;
  uploadedByProfileId: string;
  contentType: string;
  originalFilename: string;
  body: Buffer;
}

const ACCEPTED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * RN-014 — Sube el comprobante de un pago (transferencia o efectivo con foto).
 * Crea un `MediaAsset` con `category=PAYMENT_PROOF`, `visibility=PRIVATE` y
 * `metadata.paymentId`.
 *
 * El borrado físico (RN-060) lo programa el listener `PaymentApprovedListener`
 * al recibir `PAYMENT_APPROVED`.
 */
@Injectable()
export class UploadPaymentProofUseCase {
  private readonly logger = new Logger(UploadPaymentProofUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    @Inject(PROOF_STORAGE_PORT)
    private readonly proofs: IProofStoragePort,
  ) {}

  async execute(input: UploadPaymentProofInput): Promise<MediaAsset> {
    const payment = await this.repo.findById(input.paymentId);
    if (!payment) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Pago no encontrado',
        HttpStatus.NOT_FOUND,
        { paymentId: input.paymentId },
      );
    }

    if (payment.status === 'procesado') {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        'No se puede subir comprobante a un pago ya procesado',
        HttpStatus.CONFLICT,
        { paymentId: payment.id, status: payment.status },
      );
    }
    if (payment.status === 'fallido' || payment.status === 'reembolsado') {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        `No se puede subir comprobante a un pago en estado ${payment.status}`,
        HttpStatus.CONFLICT,
        { paymentId: payment.id, status: payment.status },
      );
    }

    if (!isValidPaymentMethod(payment.method)) {
      throw new BusinessError(
        ErrorCode.PAYMENT_METHOD_INVALID,
        `Método de pago inválido: ${payment.method}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const method = normalizeMethod(payment.method as never);
    if (!requiresProof(method)) {
      throw new BusinessError(
        ErrorCode.PAYMENT_METHOD_INVALID,
        `El método ${method} no requiere comprobante`,
        HttpStatus.BAD_REQUEST,
        { method },
      );
    }

    if (!input.body || input.body.byteLength === 0) {
      throw new BusinessError(
        ErrorCode.PAYMENT_PROOF_REQUIRED,
        'El archivo de comprobante es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.body.byteLength > MAX_FILE_SIZE) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'El archivo excede el tamaño máximo permitido (10MB)',
        HttpStatus.PAYLOAD_TOO_LARGE,
        { sizeBytes: input.body.byteLength },
      );
    }
    if (!ACCEPTED_CONTENT_TYPES.has(input.contentType.toLowerCase())) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        `Tipo de archivo no permitido: ${input.contentType}`,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        { contentType: input.contentType },
      );
    }

    const asset = await this.proofs.upload({
      paymentId: payment.id,
      uploadedByProfileId: input.uploadedByProfileId,
      contentType: input.contentType,
      originalFilename: input.originalFilename,
      body: input.body,
    });

    this.logger.log(
      `Comprobante subido para payment ${payment.id} (asset=${asset.id})`,
    );
    return asset;
  }
}
