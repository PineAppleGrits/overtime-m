import { ProfileContact, TeamWithCaptain } from '../../application/ports/notification-context.port';

export function uniqueEmails(contacts: (ProfileContact | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const c of contacts) {
    if (c?.email) set.add(c.email);
  }
  return [...set];
}

export function recipientFromTeam(team: TeamWithCaptain | null): {
  email: string;
  name: string;
} | null {
  if (!team) return null;
  if (team.captain?.email) {
    return { email: team.captain.email, name: team.captain.name };
  }
  // No hay captain con email — devolver null para que el caller
  // pueda hacer fallback con `?? requester`.
  return null;
}
