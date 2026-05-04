import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateAnnouncementInput,
  IMatchContextPort,
  MatchPhotoFolderContext,
} from '../../application/ports/match-context.port';

/**
 * Adapter para leer/escribir datos de Match relevantes para la creación de
 * carpeta de Drive (RN-051) y la persistencia del enlace via `MatchAnnouncement`.
 *
 * No depende del módulo `matches` (W3.1) — usa Prisma directo.
 */
@Injectable()
export class MatchContextAdapter implements IMatchContextPort {
  constructor(private readonly prisma: PrismaService) {}

  async getMatchPhotoFolderContext(
    matchId: string,
  ): Promise<MatchPhotoFolderContext | null> {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        matchDate: true,
        matchTime: true,
        homeTeam: { select: { name: true, slug: true } },
        awayTeam: { select: { name: true, slug: true } },
        category: {
          select: {
            name: true,
            slug: true,
            tournament: { select: { name: true, slug: true } },
          },
        },
        matchStaff: {
          where: { role: 'photographer', status: { in: ['assigned', 'applied'] } },
          select: { staffId: true },
          take: 1,
        },
      },
    });

    if (!match) return null;

    return {
      matchId: match.id,
      matchDate: match.matchDate,
      matchTime: match.matchTime,
      homeTeamName: match.homeTeam?.name ?? null,
      homeTeamSlug: match.homeTeam?.slug ?? null,
      awayTeamName: match.awayTeam?.name ?? null,
      awayTeamSlug: match.awayTeam?.slug ?? null,
      categoryName: match.category?.name ?? null,
      categorySlug: match.category?.slug ?? null,
      tournamentName: match.category?.tournament?.name ?? null,
      tournamentSlug: match.category?.tournament?.slug ?? null,
      photographerStaffId: match.matchStaff[0]?.staffId ?? null,
    };
  }

  async createAnnouncement(input: CreateAnnouncementInput): Promise<void> {
    await this.prisma.matchAnnouncement.create({
      data: {
        matchId: input.matchId,
        type: input.type,
        title: input.title,
        message: input.message,
        createdBy: input.createdByProfileId,
      },
    });
  }
}
