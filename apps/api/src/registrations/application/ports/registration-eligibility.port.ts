import type { Prisma } from '@prisma/client';

export const REGISTRATION_ELIGIBILITY_PORT = Symbol(
  'REGISTRATION_ELIGIBILITY_PORT',
);

export interface RegistrationEligibilityPort {
  assertTeamEligibleForRegistration(params: {
    teamId: string;
    tournamentId: string;
    categoryId: string;
  }): Promise<void>;
  assertProfileEligibleForRegistration(
    params: {
      profileId: string;
      tournamentId: string;
      categoryId: string;
    },
    prisma?: Prisma.TransactionClient,
  ): Promise<void>;
}

