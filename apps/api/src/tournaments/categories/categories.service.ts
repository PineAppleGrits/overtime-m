import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: createCategoryDto.tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
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
    await this.findOne(id);

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
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
