import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { generateUniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateCategorySlug(
    name: string,
    tournamentId: string,
    excludeId?: string,
  ): Promise<string> {
    return generateUniqueSlug({
      value: name,
      exists: async (slug) => {
        const existing = await this.prisma.category.findFirst({
          where: {
            tournamentId,
            slug,
            deletedAt: null,
            ...(excludeId ? { id: { not: excludeId } } : {}),
          },
        });
        return !!existing;
      },
    });
  }

  async findByTournamentSlugAndCategorySlug(
    tournamentSlug: string,
    categorySlug: string,
  ) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { slug: tournamentSlug, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament not found`);
    }

    const category = await this.prisma.category.findFirst({
      where: {
        tournamentId: tournament.id,
        slug: categorySlug,
        deletedAt: null,
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        zones: true,
        _count: {
          select: {
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: createCategoryDto.tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const slug = await this.generateCategorySlug(
      createCategoryDto.name,
      createCategoryDto.tournamentId,
    );

    const category = await this.prisma.category.create({
      data: { ...createCategoryDto, slug },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        zones: true,
        _count: {
          select: {
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Category created: ${category.name}`);

    return category;
  }

  async findAll(tournamentId: string, paginationDto: PaginationDto) {
    // Verificar que el torneo existe
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          tournamentId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tournament: { select: { id: true, name: true, sportId: true } },
          zones: {
            include: {
              _count: {
                select: {
                  teamZones: true,
                  matches: true,
                },
              },
            },
          },
          _count: {
            select: {
              zones: true,
              registrations: true,
              matches: true,
            },
          },
        },
      }),
      this.prisma.category.count({
        where: {
          tournamentId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            sportId: true,
          },
        },
        zones: {
          include: {
            teamZones: {
              include: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                teamZones: true,
                matches: true,
              },
            },
          },
        },
        registrations: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const existing = await this.findOne(id);

    const data: Record<string, unknown> = { ...updateCategoryDto };
    if (updateCategoryDto.name && updateCategoryDto.name !== existing.name) {
      data.slug = await this.generateCategorySlug(
        updateCategoryDto.name,
        existing.tournamentId,
        id,
      );
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data,
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        zones: true,
        _count: {
          select: {
            zones: true,
            registrations: true,
            matches: true,
          },
        },
      },
    });

    this.logger.log(`Category updated: ${updatedCategory.name}`);

    return updatedCategory;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Category deleted: ${id}`);

    return { message: 'Category deleted successfully' };
  }
}
