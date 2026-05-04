import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ITournamentLookupPort } from '../../application/ports/tournament-lookup.port';

@Injectable()
export class PrismaTournamentLookupRepository implements ITournamentLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async exists(tournamentId: string): Promise<boolean> {
    const count = await this.prisma.tournament.count({
      where: { id: tournamentId },
    });
    return count > 0;
  }
}
