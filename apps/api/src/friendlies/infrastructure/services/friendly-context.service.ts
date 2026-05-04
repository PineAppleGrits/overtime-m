import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  DelegateRecipient,
  IFriendlyContext,
  TeamContext,
} from '../../application/ports/friendly-context.port';

/**
 * Resolución de datos cross-feature (Teams + Profile) para Friendlies.
 *
 * "Delegado" en este contexto = creator o captain del equipo. Si en una
 * iteración futura se introduce un rol explícito de delegado (RN-005),
 * se actualiza la lógica acá sin tocar los use-cases.
 */
@Injectable()
export class FriendlyContextService implements IFriendlyContext {
  constructor(private readonly prisma: PrismaService) {}

  async findTeamsByIds(ids: string[]): Promise<TeamContext[]> {
    if (ids.length === 0) return [];
    const teams = await this.prisma.team.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: {
        id: true,
        name: true,
        sportId: true,
        creatorId: true,
        captainId: true,
      },
    });
    return teams.map((t) => ({
      id: t.id,
      name: t.name,
      sportId: t.sportId,
      creatorProfileId: t.creatorId,
      captainProfileId: t.captainId,
    }));
  }

  async findDelegatesForTeam(teamId: string): Promise<DelegateRecipient[]> {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, deletedAt: null },
      select: {
        creator: { select: { id: true, name: true, email: true } },
        captain: { select: { id: true, name: true, email: true } },
      },
    });
    if (!team) return [];

    const recipients: DelegateRecipient[] = [];
    if (team.creator?.email) {
      recipients.push({
        profileId: team.creator.id,
        email: team.creator.email,
        name: team.creator.name,
      });
    }
    if (
      team.captain?.email &&
      team.captain.id !== team.creator?.id
    ) {
      recipients.push({
        profileId: team.captain.id,
        email: team.captain.email,
        name: team.captain.name,
      });
    }
    return recipients;
  }

  async isDelegateOfTeam(
    profileId: string,
    teamId: string,
  ): Promise<boolean> {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, deletedAt: null },
      select: { creatorId: true, captainId: true },
    });
    if (!team) return false;
    return team.creatorId === profileId || team.captainId === profileId;
  }

  async findTeamsWhereDelegate(profileId: string): Promise<string[]> {
    const teams = await this.prisma.team.findMany({
      where: {
        deletedAt: null,
        OR: [{ creatorId: profileId }, { captainId: profileId }],
      },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }
}
