import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CreateSportDto, UpdateSportDto } from '@overtime-mono/shared';
import type {
  ISportRepository,
  SportWithRelations,
} from '../../application/ports/sport-repository.port';

@Injectable()
export class PrismaSportRepository implements ISportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSportDto) {
    return this.prisma.sport.create({ data });
  }

  async findAll() {
    return this.prisma.sport.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<SportWithRelations | null> {
    return this.prisma.sport.findUnique({
      where: { id },
      include: {
        teams: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        tournaments: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.sport.findUnique({
      where: { code },
    });
  }

  async findByName(name: string) {
    return this.prisma.sport.findUnique({
      where: { name },
    });
  }

  async update(id: string, data: UpdateSportDto) {
    return this.prisma.sport.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.prisma.sport.delete({
      where: { id },
    });
  }

  async countTeams(id: string) {
    return this.prisma.team.count({
      where: { sportId: id, deletedAt: null },
    });
  }

  async countTournaments(id: string) {
    return this.prisma.tournament.count({
      where: { sportId: id, deletedAt: null },
    });
  }
}
