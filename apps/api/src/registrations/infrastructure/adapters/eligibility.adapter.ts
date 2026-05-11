import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { EligibilityService } from '../../../eligibility/eligibility.service';
import type { RegistrationEligibilityPort } from '../../application/ports/registration-eligibility.port';

@Injectable()
export class RegistrationEligibilityAdapter
  implements RegistrationEligibilityPort
{
  constructor(private readonly eligibility: EligibilityService) {}

  async assertTeamEligibleForRegistration(params: {
    teamId: string;
    tournamentId: string;
    categoryId: string;
  }): Promise<void> {
    await this.eligibility.assertTeamEligibleForRegistration(params);
  }

  async assertProfileEligibleForRegistration(
    params: {
      profileId: string;
      tournamentId: string;
      categoryId: string;
    },
    prisma?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.eligibility.assertProfileEligibleForRegistration(params, prisma);
  }
}

