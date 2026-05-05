import { Injectable, Logger } from '@nestjs/common';
import {
  DniVerificationInput,
  DniVerificationResult,
  IDniVerificationPort,
} from '../../application/ports/dni-verification.port';

/**
 * STUB del puerto `IDniVerificationPort`.
 *
 * DP-009 — todavía no se decidió el mecanismo concreto (OCR + IA / lector
 * físico de DNI / mix). Por ahora devolvemos siempre `requiresManualReview`
 * para que un admin valide a mano.
 *
 * Cuando se elija la estrategia, se reemplaza este adapter sin tocar
 * use-cases ni listeners.
 */
@Injectable()
export class DniVerificationStubAdapter implements IDniVerificationPort {
  private readonly logger = new Logger(DniVerificationStubAdapter.name);

  // TODO: DP-009 — implementar OCR/IA o lector físico.
  async verify(input: DniVerificationInput): Promise<DniVerificationResult> {
    this.logger.log(
      `DNI verification STUB: profile=${input.profileId} asset=${input.assetId} → requiresManualReview=true`,
    );
    return {
      verified: false,
      requiresManualReview: true,
      reason: 'stub:awaiting-DP-009',
    };
  }
}
