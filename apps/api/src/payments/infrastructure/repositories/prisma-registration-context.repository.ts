import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IRegistrationContextPort,
  RegistrationSummary,
} from '../../application/ports/registration-context.port';

@Injectable()
export class PrismaRegistrationContextRepository
  implements IRegistrationContextPort
{
  constructor(private readonly prisma: PrismaService) {}

  async getById(registrationId: string): Promise<RegistrationSummary | null> {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        team: { select: { id: true, name: true } },
        tournament: {
          select: {
            id: true,
            name: true,
            sportId: true,
            insurancePerPlayer: true,
          },
        },
        category: { select: { id: true, name: true } },
        rosterEntries: { select: { profileId: true } },
      },
    });
    if (!reg) return null;
    return {
      id: reg.id,
      status: reg.status,
      teamId: reg.teamId,
      tournamentId: reg.tournamentId,
      categoryId: reg.categoryId,
      team: reg.team,
      tournament: reg.tournament,
      category: reg.category,
      rosterProfileIds: reg.rosterEntries.map((e) => e.profileId),
    };
  }

  async markPaid(registrationId: string): Promise<void> {
    await this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'pagada' },
    });
  }
}
