import { ProfileRole } from '@prisma/client';

/**
 * Reglas puras de asignación de roles. RN-057 — staff puede asignar roles
 * a cuentas existentes o pre-crear cuentas con rol.
 *
 * Reglas:
 * - `master` no puede ser creado ni asignado por nadie (es manual via DB).
 * - `admin` sólo puede ser asignado por `master`.
 * - `admin` no puede modificar a otro `admin` ni a `master`.
 * - El resto de roles (`player`, `referee`, `official`, `photographer`)
 *   pueden ser asignados por `admin` o `master`.
 */

export type ActorRole = string;

const PRIVILEGED_ROLES: readonly ProfileRole[] = [
  ProfileRole.master,
  ProfileRole.admin,
];

const ASSIGNABLE_BY_ADMIN: readonly ProfileRole[] = [
  ProfileRole.player,
  ProfileRole.referee,
  ProfileRole.official,
  ProfileRole.photographer,
];

export class RoleAssignmentForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoleAssignmentForbiddenError';
  }
}

export function isValidProfileRole(role: string): role is ProfileRole {
  return Object.values(ProfileRole).includes(role as ProfileRole);
}

export function canActorAssignRole(
  actorRole: ActorRole,
  newRole: ProfileRole,
): boolean {
  if (newRole === ProfileRole.master) return false;
  if (actorRole === ProfileRole.master) return true;
  if (actorRole === ProfileRole.admin) {
    return ASSIGNABLE_BY_ADMIN.includes(newRole);
  }
  return false;
}

export function canActorTouchTarget(
  actorRole: ActorRole,
  targetRole: ProfileRole,
): boolean {
  if (actorRole === ProfileRole.master) return true;
  if (actorRole === ProfileRole.admin) {
    return !PRIVILEGED_ROLES.includes(targetRole);
  }
  return false;
}

export function assertCanAssignRole(
  actorRole: ActorRole,
  newRole: ProfileRole,
): void {
  if (!canActorAssignRole(actorRole, newRole)) {
    throw new RoleAssignmentForbiddenError(
      `El rol ${actorRole} no puede asignar el rol ${newRole}`,
    );
  }
}

export function assertCanTouchTarget(
  actorRole: ActorRole,
  targetRole: ProfileRole,
): void {
  if (!canActorTouchTarget(actorRole, targetRole)) {
    throw new RoleAssignmentForbiddenError(
      `El rol ${actorRole} no puede modificar a un usuario con rol ${targetRole}`,
    );
  }
}
