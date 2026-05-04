import { Injectable } from '@nestjs/common';
import { CategoryLevel as PrismaCategoryLevel } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CategoryLevel } from '../../domain/entities/category-level.entity';
import { LevelCode } from '../../domain/value-objects/level-code.vo';
import {
  CreateCategoryLevelInput,
  ICategoryLevelRepository,
  UpdateCategoryLevelInput,
} from '../../application/ports/category-level.repository';

@Injectable()
export class PrismaCategoryLevelRepository implements ICategoryLevelRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaCategoryLevel): CategoryLevel {
    return new CategoryLevel(
      row.id,
      row.sportId,
      LevelCode.create(row.code),
      row.displayName,
      row.rank,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findById(id: string): Promise<CategoryLevel | null> {
    const row = await this.prisma.categoryLevel.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySportAndCode(
    sportId: string,
    code: string,
  ): Promise<CategoryLevel | null> {
    const row = await this.prisma.categoryLevel.findUnique({
      where: { sportId_code: { sportId, code } },
    });
    return row ? this.toDomain(row) : null;
  }

  async listBySport(sportId: string): Promise<CategoryLevel[]> {
    const rows = await this.prisma.categoryLevel.findMany({
      where: { sportId },
      orderBy: { rank: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(input: CreateCategoryLevelInput): Promise<CategoryLevel> {
    const row = await this.prisma.categoryLevel.create({
      data: {
        sportId: input.sportId,
        code: input.code,
        displayName: input.displayName,
        rank: input.rank,
      },
    });
    return this.toDomain(row);
  }

  async update(
    id: string,
    input: UpdateCategoryLevelInput,
  ): Promise<CategoryLevel> {
    const row = await this.prisma.categoryLevel.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.rank !== undefined ? { rank: input.rank } : {}),
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.categoryLevel.delete({ where: { id } });
  }

  async countTeamsAssigned(id: string): Promise<number> {
    return this.prisma.teamCategoryLevel.count({
      where: { categoryLevelId: id },
    });
  }

  async countCategoriesUsing(id: string): Promise<number> {
    return this.prisma.category.count({
      where: { categoryLevelId: id },
    });
  }
}
