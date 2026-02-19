import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createPlayerDto: CreatePlayerDto) {
    // Verificar que no exista ya un Player para este supabaseUserId
    const existingPlayer = await this.prisma.player.findUnique({
      where: { supabaseUserId: createPlayerDto.supabaseUserId },
    });

    if (existingPlayer) {
      throw new ConflictException(
        'Player profile already exists for this user',
      );
    }

    // Verificar que exista el Profile
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId: createPlayerDto.supabaseUserId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const player = await this.prisma.player.create({
      data: createPlayerDto,
      include: {
        teams: {
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
      },
    });

    this.logger.log(`Player created: ${player.firstName} ${player.lastName}`);

    return player;
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          teams: {
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
        },
      }),
      this.prisma.player.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: players,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                sport: true,
              },
            },
          },
        },
        captainOf: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!player || player.deletedAt) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    // Verificar que el jugador existe
    await this.findOne(id);

    const updatedPlayer = await this.prisma.player.update({
      where: { id },
      data: updatePlayerDto,
      include: {
        teams: {
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
      },
    });

    this.logger.log(
      `Player updated: ${updatedPlayer.firstName} ${updatedPlayer.lastName}`,
    );

    return updatedPlayer;
  }

  async remove(id: string) {
    // Verificar que el jugador existe
    await this.findOne(id);

    // Soft delete
    await this.prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Player deleted (soft): ${id}`);

    return { message: 'Player deleted successfully' };
  }
}
