import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateFriendlyInput,
  FriendlyWithDeposits,
  IFriendlyRepository,
  ListFriendliesFilter,
} from '../../application/ports/friendly-repository.port';
import { FriendlyState } from '../../domain/entities/friendly.entity';

const friendlyInclude = Prisma.validator<Prisma.FriendlyInclude>()({
  debts: {
    where: { deletedAt: null, type: 'FRIENDLY_DEPOSIT' },
    select: {
      id: true,
      teamId: true,
      type: true,
      status: true,
      currentBalance: true,
      originAmount: true,
    },
  },
});

@Injectable()
export class PrismaFriendlyRepository implements IFriendlyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateFriendlyInput): Promise<FriendlyWithDeposits> {
    return this.prisma.friendly.create({
      data: {
        sportId: input.sportId,
        modality: input.modality,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        proposedDate: input.proposedDate,
        venueId: input.venueId ?? null,
        notes: input.notes ?? null,
        status: input.status,
        createdByProfileId: input.createdByProfileId,
      },
      include: friendlyInclude,
    });
  }

  async findById(id: string): Promise<FriendlyWithDeposits | null> {
    return this.prisma.friendly.findFirst({
      where: { id, deletedAt: null },
      include: friendlyInclude,
    });
  }

  async list(
    filter: ListFriendliesFilter,
  ): Promise<{ data: FriendlyWithDeposits[]; total: number }> {
    const where: Prisma.FriendlyWhereInput = {
      deletedAt: null,
    };

    if (filter.teamId) {
      where.OR = [
        { homeTeamId: filter.teamId },
        { awayTeamId: filter.teamId },
      ];
    } else if (filter.visibleTeamIds && filter.visibleTeamIds.length > 0) {
      where.OR = [
        { homeTeamId: { in: filter.visibleTeamIds } },
        { awayTeamId: { in: filter.visibleTeamIds } },
      ];
    }

    if (filter.statuses && filter.statuses.length > 0) {
      where.status = { in: filter.statuses };
    }

    if (filter.from || filter.to) {
      where.proposedDate = {};
      if (filter.from) where.proposedDate.gte = filter.from;
      if (filter.to) where.proposedDate.lte = filter.to;
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.friendly.findMany({
        where,
        include: friendlyInclude,
        orderBy: { proposedDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.friendly.count({ where }),
    ]);

    return { data, total };
  }

  async findOverduePending(now: Date): Promise<FriendlyWithDeposits[]> {
    return this.prisma.friendly.findMany({
      where: {
        deletedAt: null,
        status: { in: ['GENERATED', 'PENDING_CONFIRMATION'] },
        confirmationDeadline: { lt: now },
      },
      include: friendlyInclude,
      take: 200, // batch sano por corrida
    });
  }

  async updateState(
    id: string,
    patch: Partial<FriendlyState>,
  ): Promise<FriendlyWithDeposits> {
    const data: Prisma.FriendlyUpdateInput = {};
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.confirmationDeadline !== undefined) {
      data.confirmationDeadline = patch.confirmationDeadline;
    }
    if (patch.generatedByProfileId !== undefined) {
      data.generatedBy = patch.generatedByProfileId
        ? { connect: { id: patch.generatedByProfileId } }
        : { disconnect: true };
    }
    if (patch.generatedAt !== undefined) data.generatedAt = patch.generatedAt;
    if (patch.cancelledAt !== undefined) data.cancelledAt = patch.cancelledAt;
    if (patch.cancellationReason !== undefined) {
      data.cancellationReason = patch.cancellationReason;
    }
    if (patch.observedForCategorization !== undefined) {
      data.observedForCategorization = patch.observedForCategorization;
    }
    if (patch.notes !== undefined) data.notes = patch.notes;
    if (patch.proposedDate !== undefined) {
      data.proposedDate = patch.proposedDate;
    }
    if (patch.venueId !== undefined) {
      data.venue = patch.venueId
        ? { connect: { id: patch.venueId } }
        : { disconnect: true };
    }

    return this.prisma.friendly.update({
      where: { id },
      data,
      include: friendlyInclude,
    });
  }

  async confirmWithMatch(
    id: string,
    matchId: string,
  ): Promise<FriendlyWithDeposits> {
    return this.prisma.friendly.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        resultingMatch: { connect: { id: matchId } },
      },
      include: friendlyInclude,
    });
  }
}
