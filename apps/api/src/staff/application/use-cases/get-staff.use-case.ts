import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IStaffRepository,
  ListStaffFilter,
  STAFF_REPOSITORY,
  StaffRow,
} from '../ports/staff-repository.port';

@Injectable()
export class GetStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: IStaffRepository,
  ) {}

  async findOne(id: string): Promise<StaffRow> {
    const found = await this.repo.findById(id);
    if (!found) {
      throw new BusinessError(
        ErrorCode.STAFF_NOT_FOUND,
        `Staff ${id} no encontrado`,
        HttpStatus.NOT_FOUND,
        { id },
      );
    }
    return found;
  }

  async list(filter: ListStaffFilter) {
    return this.repo.list(filter);
  }
}
