import { Injectable } from '@nestjs/common';
import { EligibilityService } from '../../../eligibility/eligibility.service';
import type { TeamEligibilityPort } from '../../application/ports/team-eligibility.port';

@Injectable()
export class TeamEligibilityAdapter implements TeamEligibilityPort {
  constructor(private readonly eligibility: EligibilityService) {}

  async assertProfileNotBlacklisted(profileId: string): Promise<void> {
    await this.eligibility.assertProfileNotBlacklisted(profileId);
  }
}

