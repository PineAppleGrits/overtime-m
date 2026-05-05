import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  computeProfileActiveStatus,
  ProfileActiveStatus,
} from '../../domain/rules/profile-status.rules';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from '../ports/profile-repository.port';

/**
 * RN-037 — computa el estado activo/inactivo de un perfil basado en sus
 * memberships activas en `ProfileTeam`.
 */
@Injectable()
export class ComputeActiveStatusUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repo: IProfileRepository,
  ) {}

  async execute(profileId: string): Promise<ProfileActiveStatus> {
    const profile = await this.repo.findById(profileId);
    if (!profile) {
      throw new BusinessError(
        ErrorCode.PROFILE_NOT_FOUND,
        'Usuario no encontrado',
        HttpStatus.NOT_FOUND,
        { profileId },
      );
    }
    const activeTeamCount = await this.repo.countActiveTeams(profileId);
    return computeProfileActiveStatus(activeTeamCount);
  }
}
