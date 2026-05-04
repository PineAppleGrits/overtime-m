import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { computeAjcFee } from '../../domain/rules/ajc-formula.rules';

export interface ComputeAjcFeeInput {
  refereeSalary: number;
  fechasToFree: number;
}

export interface ComputeAjcFeeOutput {
  amount: number;
  refereeSalary: number;
  fechasToFree: number;
}

/**
 * RN-030 — Calcular el monto AJC sin persistir nada.
 *
 * Útil como preview en el FE antes de aplicar el AJC. La fórmula es pura
 * (`refereeSalary * fechasToFree`); este use-case solo añade validaciones
 * dominio-friendly para devolver `BusinessError` en lugar de excepciones genéricas.
 */
@Injectable()
export class ComputeAjcFeeUseCase {
  execute(input: ComputeAjcFeeInput): ComputeAjcFeeOutput {
    if (!Number.isFinite(input.refereeSalary) || input.refereeSalary <= 0) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'refereeSalary debe ser un número > 0',
        HttpStatus.BAD_REQUEST,
        { refereeSalary: input.refereeSalary },
      );
    }
    if (
      !Number.isInteger(input.fechasToFree) ||
      input.fechasToFree <= 0
    ) {
      throw new BusinessError(
        ErrorCode.AJC_INVALID_FECHAS,
        'fechasToFree debe ser un entero > 0',
        HttpStatus.BAD_REQUEST,
        { fechasToFree: input.fechasToFree },
      );
    }

    const amount = computeAjcFee(input.refereeSalary, input.fechasToFree);
    return {
      amount,
      refereeSalary: input.refereeSalary,
      fechasToFree: input.fechasToFree,
    };
  }
}
