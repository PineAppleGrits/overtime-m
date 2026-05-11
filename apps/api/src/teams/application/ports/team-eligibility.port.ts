export const TEAM_ELIGIBILITY_PORT = Symbol('TEAM_ELIGIBILITY_PORT');

export interface TeamEligibilityPort {
  assertProfileNotBlacklisted(profileId: string): Promise<void>;
}

