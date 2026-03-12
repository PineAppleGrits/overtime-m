import { Profile } from "@/providers/AuthProvider";

export function hasAdminRole(profile: Profile) {
    const adminRoles = ['admin', 'master'];
    return adminRoles.includes(profile.role);
}
