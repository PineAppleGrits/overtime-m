import { Profile } from "@/providers/AuthProvider";

const ADMIN_PANEL_ROLES = ['admin', 'master', 'arbitro', 'agente_mesa', 'fotografo'];

export function hasAdminRole(profile: Profile) {
    return ADMIN_PANEL_ROLES.includes(profile.role);
}
