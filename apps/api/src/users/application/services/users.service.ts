import { Injectable } from '@nestjs/common';
import { Profile, ProfileRole } from '@prisma/client';
import { ProfileActiveStatus } from '../../domain/rules/profile-status.rules';
import { ProfileListResult } from '../ports/profile-repository.port';
import { AssignRoleUseCase } from '../use-cases/assign-role.use-case';
import {
  ComputeActiveStatusUseCase,
} from '../use-cases/compute-active-status.use-case';
import { GetUserUseCase } from '../use-cases/get-user.use-case';
import { ListUsersUseCase } from '../use-cases/list-users.use-case';
import { PreCreateAccountUseCase } from '../use-cases/pre-create-account.use-case';
import {
  UploadDniPhotoInput,
  UploadDniPhotoResult,
  UploadDniPhotoUseCase,
} from '../use-cases/upload-dni-photo.use-case';
import {
  VerifyDniInput,
  VerifyDniResult,
  VerifyDniUseCase,
} from '../use-cases/verify-dni.use-case';

/**
 * Facade del módulo Users: orquesta los use cases y expone una API
 * estable a controllers y otros módulos.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly uploadDniPhoto: UploadDniPhotoUseCase,
    private readonly verifyDni: VerifyDniUseCase,
    private readonly assignRole: AssignRoleUseCase,
    private readonly preCreateAccount: PreCreateAccountUseCase,
    private readonly computeActiveStatus: ComputeActiveStatusUseCase,
  ) {}

  list(input: {
    search?: string;
    roles?: ProfileRole[];
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'email' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProfileListResult> {
    return this.listUsers.execute(input);
  }

  findOne(id: string): Promise<Profile> {
    return this.getUser.execute(id);
  }

  uploadDni(input: UploadDniPhotoInput): Promise<UploadDniPhotoResult> {
    return this.uploadDniPhoto.execute(input);
  }

  verifyDocumentNumber(input: VerifyDniInput): Promise<VerifyDniResult> {
    return this.verifyDni.execute(input);
  }

  changeRole(input: {
    targetProfileId: string;
    newRole: string;
    actorRole: string;
    actorProfileId: string;
  }): Promise<Profile> {
    return this.assignRole.execute(input);
  }

  preCreate(input: {
    email: string;
    role: string;
    name?: string;
    actorRole: string;
  }): Promise<Profile> {
    return this.preCreateAccount.execute(input);
  }

  getActiveStatus(profileId: string): Promise<ProfileActiveStatus> {
    return this.computeActiveStatus.execute(profileId);
  }
}
