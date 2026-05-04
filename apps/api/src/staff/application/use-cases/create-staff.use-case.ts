import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { StaffTypeValue } from '../../domain/entities/staff.entity';
import {
  IStaffRepository,
  STAFF_REPOSITORY,
  StaffRow,
} from '../ports/staff-repository.port';

export interface CreateStaffInput {
  type: StaffTypeValue;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  profileId?: string | null;
}

@Injectable()
export class CreateStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: IStaffRepository,
  ) {}

  async execute(input: CreateStaffInput): Promise<StaffRow> {
    if (input.profileId) {
      const existing = await this.repo.findByProfileId(input.profileId);
      if (existing) {
        throw new BusinessError(
          ErrorCode.CONFLICT,
          'Ese perfil ya tiene un registro de staff',
          HttpStatus.CONFLICT,
          { profileId: input.profileId },
        );
      }
    }

    return this.repo.create({
      type: input.type,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      email: input.email ?? null,
      profileId: input.profileId ?? null,
      isActive: true,
    });
  }
}
