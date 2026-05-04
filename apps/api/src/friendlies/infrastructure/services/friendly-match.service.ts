import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateFriendlyMatchInput,
  IFriendlyMatchService,
} from '../../application/ports/friendly-match.port';

/**
 * Implementación interna del IFriendlyMatchService usando Prisma directo.
 *
 * Crea un Match con `matchType='amistoso'` (consistente con `MatchType.AMISTOSO`
 * en `@overtime-mono/shared`) y status='programado'.
 */
@Injectable()
export class FriendlyMatchService implements IFriendlyMatchService {
  private readonly logger = new Logger(FriendlyMatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createFriendlyMatch(
    input: CreateFriendlyMatchInput,
  ): Promise<{ id: string }> {
    const match = await this.prisma.match.create({
      data: {
        homeTeam: { connect: { id: input.homeTeamId } },
        awayTeam: { connect: { id: input.awayTeamId } },
        venue: input.venueId
          ? { connect: { id: input.venueId } }
          : undefined,
        matchDate: input.matchDate,
        status: 'programado',
        matchType: 'amistoso',
      },
      select: { id: true },
    });
    this.logger.log(
      `Match (amistoso) creado ${match.id} para friendly ${input.friendlyId}`,
    );
    return match;
  }
}
