import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateTournamentInput,
  ITournamentRepository,
  SlugExistsCheckArgs,
  TournamentRecord,
  UpdateTournamentInput,
} from '../../application/ports/tournament-repository.port';
import { TournamentStatus } from '@overtime-mono/shared';

/**
 * Implementación Prisma de `ITournamentRepository`. Sólo conoce el shape
 * básico — los includes ricos (categories/zones/registrations) se manejan
 * en el `TournamentsService` legacy mientras se completa la migración.
 */
@Injectable()
export class PrismaTournamentRepository implements ITournamentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async slugExists(args: SlugExistsCheckArgs): Promise<boolean> {
    const found = await this.prisma.tournament.findFirst({
      where: {
        slug: args.slug,
        ...(args.excludeId ? { id: { not: args.excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(found);
  }

  async findBySportId(sportId: string): Promise<{ id: string } | null> {
    return this.prisma.sport.findUnique({
      where: { id: sportId },
      select: { id: true },
    });
  }

  findById(id: string): Promise<TournamentRecord | null> {
    return this.prisma.tournament.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findBySlug(slug: string): Promise<TournamentRecord | null> {
    return this.prisma.tournament.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async create(input: CreateTournamentInput): Promise<TournamentRecord> {
    return this.prisma.tournament.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        sportId: input.sportId,
        status: input.status,
        fixtureFormat: input.fixtureFormat ?? undefined,
        modality: input.modality ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        registrationStartDate: input.registrationStartDate ?? null,
        registrationEndDate: input.registrationEndDate ?? null,
        teamOperationsOpenAt: input.teamOperationsOpenAt ?? null,
        teamOperationsCloseAt: input.teamOperationsCloseAt ?? null,
        insurancePerPlayer: input.insurancePerPlayer ?? null,
        promotionPlayoffFormat: input.promotionPlayoffFormat ?? undefined,
        earlyCancellationThresholdHours:
          input.earlyCancellationThresholdHours ?? null,
      },
    });
  }

  async update(
    id: string,
    input: UpdateTournamentInput,
  ): Promise<TournamentRecord> {
    return this.prisma.tournament.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.sportId !== undefined ? { sportId: input.sportId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.fixtureFormat !== undefined
          ? { fixtureFormat: input.fixtureFormat }
          : {}),
        ...(input.modality !== undefined ? { modality: input.modality } : {}),
        ...(input.startDate !== undefined
          ? { startDate: input.startDate }
          : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        ...(input.registrationStartDate !== undefined
          ? { registrationStartDate: input.registrationStartDate }
          : {}),
        ...(input.registrationEndDate !== undefined
          ? { registrationEndDate: input.registrationEndDate }
          : {}),
        ...(input.teamOperationsOpenAt !== undefined
          ? { teamOperationsOpenAt: input.teamOperationsOpenAt }
          : {}),
        ...(input.teamOperationsCloseAt !== undefined
          ? { teamOperationsCloseAt: input.teamOperationsCloseAt }
          : {}),
        ...(input.insurancePerPlayer !== undefined
          ? { insurancePerPlayer: input.insurancePerPlayer }
          : {}),
        ...(input.promotionPlayoffFormat !== undefined
          ? { promotionPlayoffFormat: input.promotionPlayoffFormat }
          : {}),
        ...(input.earlyCancellationThresholdHours !== undefined
          ? {
              earlyCancellationThresholdHours:
                input.earlyCancellationThresholdHours,
            }
          : {}),
      },
    });
  }

  async updateStatus(
    id: string,
    status: TournamentStatus,
  ): Promise<TournamentRecord> {
    return this.prisma.tournament.update({
      where: { id },
      data: { status },
    });
  }
}
