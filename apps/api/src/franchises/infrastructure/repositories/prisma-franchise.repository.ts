import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type {
  FranchiseDetail,
  FranchiseMine,
  FranchiseSummary,
  IFranchiseRepository,
} from '../../application/ports/franchise-repository.port';

@Injectable()
export class PrismaFranchiseRepository implements IFranchiseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    dto: { name: string; logoUrl?: string | null };
    ownerId: string;
    slug: string;
  }): Promise<FranchiseSummary> {
    return this.prisma.franchise.create({
      data: {
        name: data.dto.name,
        slug: data.slug,
        logoUrl: data.dto.logoUrl,
        ownerId: data.ownerId,
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

  async findMine(ownerId: string): Promise<FranchiseMine[]> {
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

  async findOne(id: string): Promise<FranchiseDetail | null> {
    return this.prisma.franchise.findUnique({
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
  }

  async findBySlug(slug: string, excludeId?: string) {
    return this.prisma.franchise.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }
}
