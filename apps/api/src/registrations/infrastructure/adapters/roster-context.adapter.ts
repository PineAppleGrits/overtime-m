import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { RegistrationRosterContextPort } from '../../application/ports/registration-roster-context.port';
import type { RegistrationResolvedPlayer } from '../../application/ports/registration-repository.port';

@Injectable()
export class RegistrationRosterContextAdapter
  implements RegistrationRosterContextPort
{
  constructor(private readonly prisma: PrismaService) {}

  async resolvePlayers(
    players: Array<{ documentNumber: string; name: string }>,
  ): Promise<RegistrationResolvedPlayer[]> {
    const resolvedPlayers: RegistrationResolvedPlayer[] = [];

    for (const player of players) {
      if (!player.documentNumber || !player.name) {
        throw new BadRequestException(
          'Roster players must include documentNumber and name',
        );
      }

      const documentNumber = player.documentNumber.trim();

      let profile = await this.prisma.profile.findFirst({
        where: {
          documentNumber,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          documentNumber: true,
        },
      });

      if (!profile) {
        profile = await this.prisma.profile.create({
          data: {
            name: player.name,
            documentNumber,
            role: 'player',
          },
          select: {
            id: true,
            name: true,
            documentNumber: true,
          },
        });
      }

      resolvedPlayers.push({
        profileId: profile.id,
        name: profile.name,
        documentNumber: profile.documentNumber,
      });
    }

    return resolvedPlayers;
  }
}

