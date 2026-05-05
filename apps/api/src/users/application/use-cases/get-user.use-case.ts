import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from '../ports/profile-repository.port';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repo: IProfileRepository,
  ) {}

  async execute(id: string): Promise<Profile> {
    const profile = await this.repo.findById(id);
    if (!profile) {
      throw new BusinessError(
        ErrorCode.PROFILE_NOT_FOUND,
        'Usuario no encontrado',
        HttpStatus.NOT_FOUND,
        { id },
      );
    }
    return profile;
  }
}
