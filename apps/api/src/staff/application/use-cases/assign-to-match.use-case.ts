import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Staff, StaffTypeValue } from '../../domain/entities/staff.entity';
import { slotCoversTime } from '../../domain/rules/availability.rules';
import {
  IStaffAvailabilityRepository,
  STAFF_AVAILABILITY_REPOSITORY,
} from '../ports/staff-availability-repository.port';
import {
  IMatchStaffRepository,
  MATCH_STAFF_REPOSITORY,
  MatchStaffRow,
} from '../ports/match-staff-repository.port';
import {
  IStaffRepository,
  STAFF_REPOSITORY,
} from '../ports/staff-repository.port';

export interface AssignToMatchInput {
  matchId: string;
  staffId: string;
  role: StaffTypeValue;
  assignedByProfileId: string;
  /** Bypass de la validación de disponibilidad (admin override). */
  skipAvailabilityCheck?: boolean;
  /** Bypass de la validación de conflicto horario. */
  skipConflictCheck?: boolean;
}

/**
 * RN-050 — Asignación de staff por admin a un partido.
 *
 * Validaciones:
 * - Match existe.
 * - Staff existe, está activo y su `type` coincide con `role`.
 * - El partido no tiene ya asignado el mismo staff con el mismo rol (`status='assigned'`).
 * - El staff tiene un `StaffAvailability` que cubre el día+hora del partido
 *   (a menos que `skipAvailabilityCheck=true`).
 * - El staff no tiene otro partido a la misma fecha+hora (a menos que
 *   `skipConflictCheck=true`).
 *
 * Emite `match.staff.assigned`.
 */
@Injectable()
export class AssignToMatchUseCase {
  private readonly logger = new Logger(AssignToMatchUseCase.name);

  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly staffRepo: IStaffRepository,
    @Inject(STAFF_AVAILABILITY_REPOSITORY)
    private readonly availRepo: IStaffAvailabilityRepository,
    @Inject(MATCH_STAFF_REPOSITORY)
    private readonly matchStaffRepo: IMatchStaffRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: AssignToMatchInput): Promise<MatchStaffRow> {
    const match = await this.matchStaffRepo.findMatch(input.matchId);
    if (!match) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Partido ${input.matchId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { matchId: input.matchId },
      );
    }

    const staffRow = await this.staffRepo.findById(input.staffId);
    if (!staffRow) {
      throw new BusinessError(
        ErrorCode.STAFF_NOT_FOUND,
        `Staff ${input.staffId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { staffId: input.staffId },
      );
    }

    const staff = Staff.fromState(staffRow);
    if (!staff.canBeAssignedToMatch(input.role)) {
      throw new BusinessError(
        ErrorCode.STAFF_TYPE_ROLE_MISMATCH,
        `El tipo del staff (${staffRow.type}) no coincide con el rol pedido (${input.role}) o el staff está inactivo`,
        HttpStatus.BAD_REQUEST,
        { staffType: staffRow.type, role: input.role },
      );
    }

    const existing = await this.matchStaffRepo.findByMatchAndStaffAndRole(
      input.matchId,
      input.staffId,
      input.role,
      ['assigned', 'applied'],
    );
    if (existing) {
      throw new BusinessError(
        ErrorCode.STAFF_ALREADY_ASSIGNED,
        `Este staff ya está asignado al partido como ${input.role}`,
        HttpStatus.CONFLICT,
        { matchId: input.matchId, staffId: input.staffId, role: input.role },
      );
    }

    // Validar disponibilidad horaria.
    if (!input.skipAvailabilityCheck) {
      const matchTime = match.matchTime ?? '00:00';
      const dayOfWeek = match.matchDate.getDay();
      const slots = await this.availRepo.findByStaff(input.staffId);
      const sameDay = slots.filter((s) => s.dayOfWeek === dayOfWeek);
      const covers = sameDay.some((s) =>
        slotCoversTime({ startTime: s.startTime, endTime: s.endTime }, matchTime),
      );
      if (!covers) {
        throw new BusinessError(
          ErrorCode.STAFF_NOT_AVAILABLE,
          'El staff no tiene disponibilidad horaria para este partido',
          HttpStatus.CONFLICT,
          { staffId: input.staffId, dayOfWeek, matchTime },
        );
      }
    }

    // Validar conflicto horario con otro partido.
    if (!input.skipConflictCheck) {
      const conflict = await this.matchStaffRepo.findConflictingAssignment({
        staffId: input.staffId,
        matchDate: match.matchDate,
        matchTime: match.matchTime,
        excludeMatchId: input.matchId,
      });
      if (conflict) {
        throw new BusinessError(
          ErrorCode.STAFF_HAS_CONFLICT,
          'El staff ya tiene una asignación a la misma hora',
          HttpStatus.CONFLICT,
          {
            staffId: input.staffId,
            conflictingMatchId: conflict.matchId,
          },
        );
      }
    }

    const created = await this.matchStaffRepo.create({
      matchId: input.matchId,
      staffId: input.staffId,
      role: input.role,
      status: 'assigned',
      assignedBy: input.assignedByProfileId,
      assignedAt: new Date(),
    });

    const payload: DomainEventPayloads['match.staff.assigned'] = {
      matchId: input.matchId,
      staffId: input.staffId,
      role: input.role,
    };
    this.eventEmitter.emit(DomainEvent.MATCH_STAFF_ASSIGNED, payload);

    this.logger.log(
      `Staff ${input.staffId} asignado al partido ${input.matchId} como ${input.role}`,
    );

    return created;
  }
}
