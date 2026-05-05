import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Profile, ProfileRole } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  assertCanAssignRole,
  assertCanTouchTarget,
  isValidProfileRole,
  RoleAssignmentForbiddenError,
} from '../../domain/rules/role-assignment.rules';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from '../ports/profile-repository.port';

export interface AssignRoleInput {
  targetProfileId: string;
  newRole: string;
  actorRole: string;
  actorProfileId: string;
}

/**
 * RN-057 — variante "asignar rol a cuenta existente". Aplica reglas de
 * `role-assignment.rules` y emite `PROFILE_ROLE_CHANGED`.
 */
@Injectable()
export class AssignRoleUseCase {
  private readonly logger = new Logger(AssignRoleUseCase.name);

  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repo: IProfileRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: AssignRoleInput): Promise<Profile> {
    if (!isValidProfileRole(input.newRole)) {
      throw new BusinessError(
        ErrorCode.PROFILE_ROLE_INVALID,
        `Rol inválido: ${input.newRole}`,
        HttpStatus.BAD_REQUEST,
        { newRole: input.newRole },
      );
    }
    const newRole = input.newRole as ProfileRole;

    const target = await this.repo.findById(input.targetProfileId);
    if (!target) {
      throw new BusinessError(
        ErrorCode.PROFILE_NOT_FOUND,
        'Usuario no encontrado',
        HttpStatus.NOT_FOUND,
        { profileId: input.targetProfileId },
      );
    }

    try {
      assertCanTouchTarget(input.actorRole, target.role);
      assertCanAssignRole(input.actorRole, newRole);
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

    if (target.role === newRole) {
      // Sin cambio — devolvemos el perfil sin emitir evento.
      return target;
    }

    const updated = await this.repo.updateRole({
      profileId: input.targetProfileId,
      newRole,
    });

    this.logger.log(
      `Rol cambiado: profile=${input.targetProfileId} ${target.role} → ${newRole} por ${input.actorProfileId}`,
    );

    this.eventEmitter.emit(DomainEvent.PROFILE_ROLE_CHANGED, {
      profileId: input.targetProfileId,
      fromRole: target.role,
      toRole: newRole,
      changedBy: input.actorProfileId,
    } satisfies DomainEventPayloads['profile.role.changed']);

    return updated;
  }
}
