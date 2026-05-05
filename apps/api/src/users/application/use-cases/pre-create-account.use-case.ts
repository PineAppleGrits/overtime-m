import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Profile, ProfileRole } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  assertCanAssignRole,
  isValidProfileRole,
  RoleAssignmentForbiddenError,
} from '../../domain/rules/role-assignment.rules';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from '../ports/profile-repository.port';

export interface PreCreateAccountInput {
  email: string;
  role: string;
  name?: string;
  actorRole: string;
}

/**
 * RN-057 — variante "cuenta pre-creada". Crea un Profile con email + rol,
 * sin supabaseUserId. Cuando el usuario se registra con ese email, el
 * AuthService lo asocia (lookup por email).
 *
 * Si ya existe un perfil con ese email no-borrado (deletedAt=null), falla.
 */
@Injectable()
export class PreCreateAccountUseCase {
  private readonly logger = new Logger(PreCreateAccountUseCase.name);

  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repo: IProfileRepository,
  ) {}

  async execute(input: PreCreateAccountInput): Promise<Profile> {
    if (!isValidProfileRole(input.role)) {
      throw new BusinessError(
        ErrorCode.PROFILE_ROLE_INVALID,
        `Rol inválido: ${input.role}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const role = input.role as ProfileRole;
    try {
      assertCanAssignRole(input.actorRole, role);
    } catch (err) {
      if (err instanceof RoleAssignmentForbiddenError) {
        throw new BusinessError(
          ErrorCode.FORBIDDEN,
          err.message,
          HttpStatus.FORBIDDEN,
        );
      }
      throw err;
    }

    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Email inválido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new BusinessError(
        ErrorCode.PROFILE_EMAIL_ALREADY_EXISTS,
        'Ya existe una cuenta con ese email',
        HttpStatus.CONFLICT,
        { email },
      );
    }

    const profile = await this.repo.createPreCreatedAccount({
      email,
      name: input.name?.trim() || email.split('@')[0],
      role,
    });
    this.logger.log(
      `Cuenta pre-creada (RN-057): profile=${profile.id} email=${email} role=${role}`,
    );
    return profile;
  }
}
