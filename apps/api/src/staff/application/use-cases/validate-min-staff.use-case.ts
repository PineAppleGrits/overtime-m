import { Inject, Injectable } from '@nestjs/common';
import { SportRulesRegistry } from '../../../common/sport-rules';
import {
  Modality,
  SportCode,
} from '../../../common/sport-rules/sport-rules.types';
import {
  IMatchStaffRepository,
  MATCH_STAFF_REPOSITORY,
} from '../ports/match-staff-repository.port';

export interface ValidateMinStaffInput {
  matchId: string;
  sportCode: SportCode;
  modality: Modality;
  /** Estados que cuentan como "presente" — default `['assigned','applied']`. */
  countingStatuses?: string[];
}

export interface ValidateMinStaffOutput {
  valid: boolean;
  /** Roles donde falta gente y cuánto falta. Vacío si valid=true. */
  missing: Array<{ role: string; required: number; current: number; missing: number }>;
  /** Estado actual de cada rol (para introspección). */
  current: Array<{ role: string; count: number }>;
}

/**
 * RN-049 — Verifica que el partido tenga el staff mínimo (árbitros + oficiales
 * de mesa) configurado por la strategy del deporte+modalidad.
 *
 * El caller (W3.1 — start-match) interpreta el resultado: si `valid=false`,
 * lanza `BusinessError(ErrorCode.MATCH_STAFF_BELOW_MIN)`. Aquí solo retornamos
 * datos — no lanzamos.
 *
 * Decisión: contamos `referee` y `table_official` (roles 1:1 con StaffType).
 * Photographer no es bloqueante (RN-049 no lo exige).
 */
@Injectable()
export class ValidateMinStaffUseCase {
  constructor(
    @Inject(MATCH_STAFF_REPOSITORY)
    private readonly matchStaffRepo: IMatchStaffRepository,
    private readonly sportRules: SportRulesRegistry,
  ) {}

  async execute(input: ValidateMinStaffInput): Promise<ValidateMinStaffOutput> {
    const rules = this.sportRules.get(input.sportCode, input.modality);
    const minReferees = rules.staff.minReferees;
    const minTableOfficials = rules.staff.minTableOfficials;
    const counting = input.countingStatuses ?? ['assigned', 'applied'];

    const assignments = await this.matchStaffRepo.findByMatch(input.matchId);
    const active = assignments.filter((a) => counting.includes(a.status));

    const refCount = active.filter((a) => a.role === 'referee').length;
    const officialCount = active.filter((a) => a.role === 'table_official').length;

    const missing: ValidateMinStaffOutput['missing'] = [];
    if (refCount < minReferees) {
      missing.push({
        role: 'referee',
        required: minReferees,
        current: refCount,
        missing: minReferees - refCount,
      });
    }
    if (officialCount < minTableOfficials) {
      missing.push({
        role: 'table_official',
        required: minTableOfficials,
        current: officialCount,
        missing: minTableOfficials - officialCount,
      });
    }

    return {
      valid: missing.length === 0,
      missing,
      current: [
        { role: 'referee', count: refCount },
        { role: 'table_official', count: officialCount },
      ],
    };
  }
}
