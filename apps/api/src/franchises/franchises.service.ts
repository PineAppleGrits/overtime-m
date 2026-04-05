import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CreateFranchiseSchemaDto } from '@overtime-mono/shared';
import { generateUniqueSlug } from '../common/utils/slug.util';

@Injectable()
export class FranchisesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateFranchiseSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        const existingFranchise = await this.prisma.franchise.findFirst({
          where: {
            slug,
            ...(excludeId ? { id: { not: excludeId } } : {}),
          },
          select: { id: true },
        });

        return Boolean(existingFranchise);
      },
    });
  }

  async create(dto: CreateFranchiseSchemaDto, ownerId: string) {
    return this.prisma.franchise.create({
      data: {
        name: dto.name,
        slug: await this.generateFranchiseSlug(dto.name),
        logoUrl: dto.logoUrl,
        ownerId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        ownerId: true,
        createdAt: true,
      },
    });
  }

  async findMine(ownerId: string) {
    return this.prisma.franchise.findMany({
      where: { ownerId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        teams: {
          where: { deletedAt: null },
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        ownerId: true,
        teams: {
          where: { deletedAt: null },
          include: { sport: true },
        },
      },
    });

    if (!franchise) throw new NotFoundException(`Franchise ${id} not found`);
    return franchise;
  }
}
