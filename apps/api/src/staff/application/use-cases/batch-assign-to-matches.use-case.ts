import { Injectable, Logger } from '@nestjs/common';
import { StaffTypeValue } from '../../domain/entities/staff.entity';
import { MatchStaffRow } from '../ports/match-staff-repository.port';
import { AssignToMatchUseCase } from './assign-to-match.use-case';

export interface BatchAssignItem {
  matchId: string;
  staffId: string;
  role: StaffTypeValue;
}

export interface BatchAssignInput {
  assignments: BatchAssignItem[];
  assignedByProfileId: string;
}

export interface BatchAssignOutput {
  assigned: MatchStaffRow[];
  errors: Array<{
    index: number;
    matchId: string;
    staffId: string;
    error: string;
  }>;
}

/**
 * Asigna múltiples staff a múltiples partidos en una sola llamada.
 *
 * Estrategia: best-effort. Cada item se intenta de forma independiente; los
 * errores no abortan el resto. Devolvemos `assigned` y `errors` para que el
 * caller pueda mostrar resumen.
 */
@Injectable()
export class BatchAssignToMatchesUseCase {
  private readonly logger = new Logger(BatchAssignToMatchesUseCase.name);

  constructor(private readonly assignUseCase: AssignToMatchUseCase) {}

  async execute(input: BatchAssignInput): Promise<BatchAssignOutput> {
    const assigned: MatchStaffRow[] = [];
    const errors: BatchAssignOutput['errors'] = [];

    for (let i = 0; i < input.assignments.length; i++) {
      const item = input.assignments[i];
      try {
        const result = await this.assignUseCase.execute({
          matchId: item.matchId,
          staffId: item.staffId,
          role: item.role,
          assignedByProfileId: input.assignedByProfileId,
        });
        assigned.push(result);
      } catch (err) {
        const e = err as Error;
        errors.push({
          index: i,
          matchId: item.matchId,
          staffId: item.staffId,
          error: e.message,
        });
      }
    }

    this.logger.log(
      `Batch assign: ${assigned.length} OK, ${errors.length} fallidos`,
    );
    return { assigned, errors };
  }
}
