import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IMatchStaffRepository,
  MATCH_STAFF_REPOSITORY,
} from '../ports/match-staff-repository.port';
import {
  IStaffRepository,
  STAFF_REPOSITORY,
} from '../ports/staff-repository.port';

export interface GetAssignedMatchesInput {
  staffId: string;
  matchStatus?: string;
}

@Injectable()
export class GetAssignedMatchesUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly staffRepo: IStaffRepository,
    @Inject(MATCH_STAFF_REPOSITORY)
    private readonly matchStaffRepo: IMatchStaffRepository,
  ) {}

  async execute(input: GetAssignedMatchesInput) {
    const staff = await this.staffRepo.findById(input.staffId);
    if (!staff) {
      throw new BusinessError(
        ErrorCode.STAFF_NOT_FOUND,
        `Staff ${input.staffId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { id: input.staffId },
      );
    }
    return this.matchStaffRepo.findAssignmentsForStaff(input.staffId, {
      matchStatus: input.matchStatus,
      activeOnly: true,
    });
  }
}
