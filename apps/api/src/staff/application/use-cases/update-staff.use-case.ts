import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { StaffTypeValue } from '../../domain/entities/staff.entity';
import {
  IStaffRepository,
  STAFF_REPOSITORY,
  StaffRow,
} from '../ports/staff-repository.port';

export interface UpdateStaffInput {
  id: string;
  type?: StaffTypeValue;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

@Injectable()
export class UpdateStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: IStaffRepository,
  ) {}

  async execute(input: UpdateStaffInput): Promise<StaffRow> {
    const existing = await this.repo.findById(input.id);
    if (!existing) {
      throw new BusinessError(
        ErrorCode.STAFF_NOT_FOUND,
        `Staff ${input.id} no encontrado`,
        HttpStatus.NOT_FOUND,
        { id: input.id },
      );
    }

    return this.repo.update(input.id, {
      type: input.type,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      isActive: input.isActive,
    });
  }
}
