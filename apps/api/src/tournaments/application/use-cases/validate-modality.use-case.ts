import { HttpStatus, Injectable } from '@nestjs/common';
import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import {
  Modality,
  SportCode,
} from '../../../common/sport-rules/sport-rules.types';
import { BusinessError, ErrorCode } from '../../../common/errors';

export interface ValidateModalityInput {
  /** Código del deporte (ej: 'BASKETBALL'). */
  sportCode: SportCode;
  /** Modalidad libre del torneo (puede venir null/undefined → no se valida). */
  modality?: string | null;
}

/**
 * Caso de uso: validar que la combinación (sportCode, modality) tenga una
 * strategy registrada en `SportRulesRegistry` (RN-043).
 *
 * Si `modality` no se pasa o es null, NO valida — algunos torneos viejos
 * pueden no tenerla seteada todavía. Cuando viene presente, debe ser válida.
 */
@Injectable()
export class ValidateModalityUseCase {
  constructor(private readonly sportRules: SportRulesRegistry) {}

  execute(input: ValidateModalityInput): void {
    if (!input.modality) return;

    const rules = this.sportRules.tryGet(
      input.sportCode,
      input.modality as Modality,
    );

    if (!rules) {
      throw new BusinessError(
        ErrorCode.TOURNAMENT_INVALID_MODALITY,
        `La modalidad "${input.modality}" no está soportada para el deporte "${input.sportCode}".`,
        HttpStatus.BAD_REQUEST,
        { sportCode: input.sportCode, modality: input.modality },
      );
    }
  }
}
