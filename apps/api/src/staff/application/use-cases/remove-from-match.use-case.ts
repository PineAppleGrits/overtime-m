import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IMatchStaffRepository,
  MATCH_STAFF_REPOSITORY,
} from '../ports/match-staff-repository.port';

export interface RemoveFromMatchInput {
  matchId: string;
  staffId: string;
}

@Injectable()
export class RemoveFromMatchUseCase {
  private readonly logger = new Logger(RemoveFromMatchUseCase.name);

  constructor(
    @Inject(MATCH_STAFF_REPOSITORY)
    private readonly matchStaffRepo: IMatchStaffRepository,
  ) {}

  async execute(input: RemoveFromMatchInput): Promise<void> {
    const assignment = await this.matchStaffRepo.findByMatchAndStaff(
      input.matchId,
      input.staffId,
    );
    if (!assignment) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Asignación no encontrada',
        HttpStatus.NOT_FOUND,
        { matchId: input.matchId, staffId: input.staffId },
      );
    }
    await this.matchStaffRepo.delete(assignment.id);
    this.logger.log(
      `Staff ${input.staffId} removido del partido ${input.matchId}`,
    );
  }
}
