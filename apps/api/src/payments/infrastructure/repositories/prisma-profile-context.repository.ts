import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IProfileContextPort,
  ProfileSummary,
} from '../../application/ports/profile-context.port';

@Injectable()
export class PrismaProfileContextRepository implements IProfileContextPort {
  constructor(private readonly prisma: PrismaService) {}

  async getById(profileId: string): Promise<ProfileSummary | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, name: true, email: true },
    });
    return profile ?? null;
  }
}
