import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IStaffRepository,
  STAFF_REPOSITORY,
} from '../ports/staff-repository.port';

@Injectable()
export class DeleteStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: IStaffRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new BusinessError(
        ErrorCode.STAFF_NOT_FOUND,
        `Staff ${id} no encontrado`,
        HttpStatus.NOT_FOUND,
        { id },
      );
    }
    await this.repo.softDelete(id);
  }
}
