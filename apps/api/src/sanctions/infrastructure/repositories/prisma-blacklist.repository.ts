import { Injectable } from '@nestjs/common';
import { BlacklistEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateBlacklistInput,
  IBlacklistRepository,
  ListBlacklistFilter,
  ListBlacklistResult,
  LiftBlacklistInput,
} from '../../application/ports/blacklist-repository.port';

@Injectable()
export class PrismaBlacklistRepository implements IBlacklistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateBlacklistInput): Promise<BlacklistEntry> {
    return this.prisma.blacklistEntry.create({
      data: {
        profileId: input.profileId ?? null,
        documentNumber: input.documentNumber,
        profileNameSnapshot: input.profileNameSnapshot,
        reason: input.reason,
        attachmentUrls: input.attachmentUrls ?? [],
        blockedByProfileId: input.blockedByProfileId,
      },
    });
  }

  async findById(id: string): Promise<BlacklistEntry | null> {
    return this.prisma.blacklistEntry.findUnique({ where: { id } });
  }

  async list(filter: ListBlacklistFilter): Promise<ListBlacklistResult> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'blockedAt',
      sortOrder = 'desc',
      ...rest
    } = filter;

    const where: Prisma.BlacklistEntryWhereInput = {};
    if (rest.status) where.status = rest.status;
    if (rest.profileId) where.profileId = rest.profileId;
    if (rest.documentNumber) where.documentNumber = rest.documentNumber.trim();
    if (rest.createdBy) where.blockedByProfileId = rest.createdBy;

    const [data, total] = await Promise.all([
      this.prisma.blacklistEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.blacklistEntry.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async lift(input: LiftBlacklistInput): Promise<BlacklistEntry> {
    return this.prisma.blacklistEntry.update({
      where: { id: input.id },
      data: {
        status: 'LIFTED',
        liftedByProfileId: input.liftedByProfileId,
        liftedAt: new Date(),
        resolutionNotes: input.resolutionNotes,
      },
    });
  }

  async addAttachmentUrl(
    blacklistId: string,
    url: string,
  ): Promise<BlacklistEntry> {
    const current = await this.prisma.blacklistEntry.findUnique({
      where: { id: blacklistId },
      select: { attachmentUrls: true },
    });
    if (!current) {
      throw new Error(`Blacklist ${blacklistId} no encontrada`);
    }
    return this.prisma.blacklistEntry.update({
      where: { id: blacklistId },
      data: { attachmentUrls: [...current.attachmentUrls, url] },
    });
  }

  async hasActiveEntry(params: {
    profileId?: string;
    documentNumber?: string;
  }): Promise<boolean> {
    const orConditions: Prisma.BlacklistEntryWhereInput[] = [];
    if (params.profileId) orConditions.push({ profileId: params.profileId });
    if (params.documentNumber) {
      orConditions.push({ documentNumber: params.documentNumber.trim() });
    }
    if (orConditions.length === 0) return false;

    const found = await this.prisma.blacklistEntry.findFirst({
      where: { status: 'ACTIVE', OR: orConditions },
      select: { id: true },
    });
    return found !== null;
  }

  async findActive(params: {
    profileId?: string;
    documentNumber?: string;
  }): Promise<BlacklistEntry[]> {
    const orConditions: Prisma.BlacklistEntryWhereInput[] = [];
    if (params.profileId) orConditions.push({ profileId: params.profileId });
    if (params.documentNumber) {
      orConditions.push({ documentNumber: params.documentNumber.trim() });
    }
    if (orConditions.length === 0) return [];

    return this.prisma.blacklistEntry.findMany({
      where: { status: 'ACTIVE', OR: orConditions },
      orderBy: { blockedAt: 'desc' },
    });
  }

  async deactivateProfileMemberships(profileId: string): Promise<void> {
    await this.prisma.profileTeam.updateMany({
      where: { profileId, isActive: true },
      data: { isActive: false },
    });
  }
}
