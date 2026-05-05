/**
 * RN-037 — estado activo / inactivo computado.
 *
 * Un perfil está activo si tiene al menos una membresía `ProfileTeam` con
 * `isActive=true`. Inactivo en cualquier otro caso.
 *
 * Esta regla es pura: recibe el conteo de memberships activas y devuelve
 * un boolean.
 */
export interface ProfileActiveStatus {
  isActive: boolean;
  teamCount: number;
}

export function computeProfileActiveStatus(
  activeTeamCount: number,
): ProfileActiveStatus {
  return {
    isActive: activeTeamCount >= 1,
    teamCount: activeTeamCount,
  };
}
