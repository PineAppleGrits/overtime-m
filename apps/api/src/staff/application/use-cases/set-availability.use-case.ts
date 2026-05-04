import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { validateNoOverlaps } from '../../domain/rules/availability.rules';
import {
  IStaffAvailabilityRepository,
  STAFF_AVAILABILITY_REPOSITORY,
} from '../ports/staff-availability-repository.port';
import {
  IStaffRepository,
  STAFF_REPOSITORY,
} from '../ports/staff-repository.port';

export interface SetAvailabilityInput {
  staffId: string;
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

@Injectable()
export class SetAvailabilityUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly staffRepo: IStaffRepository,
    @Inject(STAFF_AVAILABILITY_REPOSITORY)
    private readonly availRepo: IStaffAvailabilityRepository,
  ) {}

  async execute(input: SetAvailabilityInput) {
    const staff = await this.staffRepo.findById(input.staffId);
    if (!staff) {
      throw new BusinessError(
        ErrorCode.STAFF_NOT_FOUND,
        `Staff ${input.staffId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { id: input.staffId },
      );
    }

    // Validar formato HH:mm y end > start.
    for (const slot of input.slots) {
      if (
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.startTime) ||
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.endTime)
      ) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'Las horas deben tener formato HH:mm',
          HttpStatus.BAD_REQUEST,
          { slot },
        );
      }
      if (slot.startTime >= slot.endTime) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'startTime debe ser menor que endTime',
          HttpStatus.BAD_REQUEST,
          { slot },
        );
      }
      if (!Number.isInteger(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'dayOfWeek debe ser entero 0..6',
          HttpStatus.BAD_REQUEST,
          { slot },
        );
      }
    }

    const overlapError = validateNoOverlaps(input.slots);
    if (overlapError) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        overlapError,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.availRepo.replaceForStaff(input.staffId, input.slots);
  }
}
