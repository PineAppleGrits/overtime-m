import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSportDto, UpdateSportDto } from '@overtime-mono/shared';

@Injectable()
export class SportsService {
  private readonly logger = new Logger(SportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createSportDto: CreateSportDto) {
    // Verificar que el código no exista
    const existingCode = await this.prisma.sport.findUnique({
      where: { code: createSportDto.code },
    });

    if (existingCode) {
      throw new ConflictException('Sport code already exists');
    }

    // Verificar que el nombre no exista
    const existingName = await this.prisma.sport.findUnique({
      where: { name: createSportDto.name },
    });

    if (existingName) {
      throw new ConflictException('Sport name already exists');
    }

    const sport = await this.prisma.sport.create({
      data: createSportDto,
    });

    this.logger.log(`Sport created: ${sport.name}`);

    return sport;
  }

  async findAll() {
    return this.prisma.sport.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const sport = await this.prisma.sport.findUnique({
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

    if (!sport) {
      throw new NotFoundException(`Sport with ID ${id} not found`);
    }

    return sport;
  }

  async update(id: string, updateSportDto: UpdateSportDto) {
    await this.findOne(id);

    // Verificar unicidad de código si se está actualizando
    if (updateSportDto.code) {
      const existingCode = await this.prisma.sport.findUnique({
        where: { code: updateSportDto.code },
      });

      if (existingCode && existingCode.id !== id) {
        throw new ConflictException('Sport code already exists');
      }
    }

    // Verificar unicidad de nombre si se está actualizando
    if (updateSportDto.name) {
      const existingName = await this.prisma.sport.findUnique({
        where: { name: updateSportDto.name },
      });

      if (existingName && existingName.id !== id) {
        throw new ConflictException('Sport name already exists');
      }
    }

    const sport = await this.prisma.sport.update({
      where: { id },
      data: updateSportDto,
    });

    this.logger.log(`Sport updated: ${sport.name}`);

    return sport;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Verificar que no haya equipos o torneos asociados
    const teamsCount = await this.prisma.team.count({
      where: { sportId: id, deletedAt: null },
    });

    if (teamsCount > 0) {
      throw new ConflictException('Cannot delete sport with associated teams');
    }

    const tournamentsCount = await this.prisma.tournament.count({
      where: { sportId: id, deletedAt: null },
    });

    if (tournamentsCount > 0) {
      throw new ConflictException(
        'Cannot delete sport with associated tournaments',
      );
    }

    await this.prisma.sport.delete({
      where: { id },
    });

    this.logger.log(`Sport deleted: ${id}`);

    return { message: 'Sport deleted successfully' };
  }
}
