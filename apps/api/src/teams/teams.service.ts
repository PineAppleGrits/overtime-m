import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddPlayerDto } from './dto/add-player.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto, creatorId: string) {
    // Verificar que el deporte existe
    const sport = await this.prisma.sport.findUnique({
      where: { id: createTeamDto.sportId },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    // Verificar que el capitán existe (si se proporciona)
    if (createTeamDto.captainId) {
      const captain = await this.prisma.player.findUnique({
        where: { id: createTeamDto.captainId },
      });

      if (!captain) {
        throw new NotFoundException('Captain not found');
      }
    }

    const team = await this.prisma.team.create({
      data: {
        ...createTeamDto,
        creatorId,
      },
      include: {
        sport: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        captain: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    this.logger.log(`Team created: ${team.name}`);

    return team;
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sport: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          captain: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
          players: {
            include: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  jerseyNumber: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.team.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: teams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id, deletedAt: null },
      include: {
        sport: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        captain: true,
        players: {
          include: {
            player: true,
          },
        },
        teamZones: {
          include: {
            zone: {
              include: {
                category: {
                  include: {
                    tournament: true,
                  },
                },
              },
            },
          },
        },
        registrations: {
          include: {
            tournament: true,
            category: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    await this.findOne(id);

    // Si se está actualizando el deporte, verificar que existe
    if (updateTeamDto.sportId) {
      const sport = await this.prisma.sport.findUnique({
        where: { id: updateTeamDto.sportId },
      });

      if (!sport) {
        throw new NotFoundException('Sport not found');
      }
    }

    // Si se está actualizando el capitán, verificar que existe y está en el equipo
    if (updateTeamDto.captainId) {
      const captain = await this.prisma.player.findUnique({
        where: { id: updateTeamDto.captainId },
      });

      if (!captain) {
        throw new NotFoundException('Captain not found');
      }

      // Verificar que el capitán está en el equipo
      const playerInTeam = await this.prisma.playerTeam.findFirst({
        where: {
          teamId: id,
          playerId: updateTeamDto.captainId,
          isActive: true,
        },
      });

      if (!playerInTeam) {
        throw new BadRequestException('Captain must be a member of the team');
      }
    }

    const team = await this.prisma.team.update({
      where: { id },
      data: updateTeamDto,
      include: {
        sport: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        captain: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    this.logger.log(`Team updated: ${team.name}`);

    return team;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Team deleted: ${id}`);

    return { message: 'Team deleted successfully' };
  }

  /**
   * Agregar jugador al equipo
   */
  async addPlayer(teamId: string, addPlayerDto: AddPlayerDto) {
    const team = await this.findOne(teamId);

    // Verificar que el jugador existe
    const player = await this.prisma.player.findUnique({
      where: { id: addPlayerDto.playerId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                teamZones: {
                  include: {
                    zone: {
                      include: {
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    // Verificar que el jugador no está ya en el equipo
    const existingMembership = await this.prisma.playerTeam.findFirst({
      where: {
        teamId,
        playerId: addPlayerDto.playerId,
      },
    });

    if (existingMembership) {
      // Si está inactivo, reactivar
      if (!existingMembership.isActive) {
        await this.prisma.playerTeam.update({
          where: { id: existingMembership.id },
          data: { isActive: true, joinedAt: new Date() },
        });
        return this.findOne(teamId);
      }
      throw new ConflictException('Player already in team');
    }

    // REGLA DE NEGOCIO: Un jugador NO puede estar en múltiples equipos de la misma categoría
    // Obtener las categorías del equipo actual
    const teamCategories = team.teamZones.map((tz) => tz.zone.category.id);

    if (teamCategories.length > 0) {
      // Verificar si el jugador está en algún equipo de las mismas categorías
      for (const playerTeam of player.teams) {
        if (!playerTeam.isActive) continue;

        const otherTeamCategories = playerTeam.team.teamZones.map(
          (tz) => tz.zone.category.id,
        );

        const commonCategories = teamCategories.filter((catId) =>
          otherTeamCategories.includes(catId),
        );

        if (commonCategories.length > 0) {
          throw new ConflictException(
            `Player is already in another team in the same category`,
          );
        }
      }
    }

    // Agregar jugador al equipo
    await this.prisma.playerTeam.create({
      data: {
        teamId,
        playerId: addPlayerDto.playerId,
      },
    });

    this.logger.log(
      `Player ${player.firstName} ${player.lastName} added to team ${team.name}`,
    );

    return this.findOne(teamId);
  }

  /**
   * Remover jugador del equipo
   */
  async removePlayer(teamId: string, playerId: string) {
    await this.findOne(teamId);

    const playerTeam = await this.prisma.playerTeam.findFirst({
      where: {
        teamId,
        playerId,
        isActive: true,
      },
    });

    if (!playerTeam) {
      throw new NotFoundException('Player not in team');
    }

    // Marcar como inactivo en lugar de eliminar
    await this.prisma.playerTeam.update({
      where: { id: playerTeam.id },
      data: { isActive: false },
    });

    this.logger.log(`Player ${playerId} removed from team ${teamId}`);

    return this.findOne(teamId);
  }

  /**
   * Asignar capitán
   */
  async assignCaptain(teamId: string, playerId: string) {
    const team = await this.findOne(teamId);

    // Verificar que el jugador está en el equipo
    const playerInTeam = await this.prisma.playerTeam.findFirst({
      where: {
        teamId,
        playerId,
        isActive: true,
      },
    });

    if (!playerInTeam) {
      throw new BadRequestException('Player must be a member of the team');
    }

    const updatedTeam = await this.prisma.team.update({
      where: { id: teamId },
      data: { captainId: playerId },
      include: {
        sport: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        captain: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    this.logger.log(`Captain assigned to team ${team.name}`);

    return updatedTeam;
  }
}
