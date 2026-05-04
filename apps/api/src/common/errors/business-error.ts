import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

export interface BusinessErrorDetails {
  /** Detalles opcionales destinados al FE (no contienen secretos). */
  [key: string]: unknown;
}

/**
 * Excepción de dominio con código estable.
 *
 * El FE matchea por `code`, no por `message`. El mensaje es para humanos
 * en español, el código es el contrato.
 *
 * Uso:
 * ```ts
 * throw new BusinessError(
 *   ErrorCode.REGISTRATION_DUPLICATE,
 *   'El equipo ya está inscripto en este torneo',
 *   HttpStatus.CONFLICT,
 *   { teamId, tournamentId },
 * );
 * ```
 *
 * El `AllExceptionsFilter` detecta este tipo y serializa el JSON con `code`,
 * `message` y `details` (cuando está presente).
 */
export class BusinessError extends HttpException {
  readonly code: ErrorCode;
  readonly details?: BusinessErrorDetails;

  constructor(
    code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: BusinessErrorDetails,
  ) {
    super({ code, message, details }, status);
    this.code = code;
    this.details = details;
  }
}
