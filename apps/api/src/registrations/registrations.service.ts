import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createRegistrationDto: CreateRegistrationDto,
    requestedBy: string,
  ) {
    // Verificar que el equipo existe
    const team = await this.prisma.team.findUnique({
      where: { id: createRegistrationDto.teamId, deletedAt: null },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Verificar que el torneo existe y está en estado de inscripción
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: createRegistrationDto.tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new BadRequestException(
        `Tournament is not accepting registrations. Current status: ${tournament.status}`,
      );
    }

    // Verificar fechas de inscripción
    const now = new Date();
    if (
      tournament.registrationStartDate &&
      tournament.registrationStartDate > now
    ) {
      throw new BadRequestException('Registration period has not started yet');
    }

    if (
      tournament.registrationEndDate &&
      tournament.registrationEndDate < now
    ) {
      throw new BadRequestException('Registration period has ended');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: createRegistrationDto.categoryId, deletedAt: null },
      include: { tournament: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.tournamentId !== createRegistrationDto.tournamentId) {
      throw new BadRequestException(
        'Category does not belong to the specified tournament',
      );
    }

    if (team.sportId !== category.tournament.sportId) {
      throw new BadRequestException('Team sport must match category sport');
    }

    // REGLA DE NEGOCIO: Un equipo solo puede estar en 1 categoría por torneo
    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        teamId: createRegistrationDto.teamId,
        tournamentId: createRegistrationDto.tournamentId,
        status: {
          notIn: ['rechazada'],
        },
      },
    });

    if (existingRegistration) {
      if (
        existingRegistration.categoryId === createRegistrationDto.categoryId
      ) {
        throw new ConflictException(
          'Team is already registered in this category',
        );
      } else {
        throw new ConflictException(
          `Team is already registered in another category (${existingRegistration.categoryId}) of this tournament. A team can only be in one category per tournament.`,
        );
      }
    }

    // Crear inscripción
    const registration = await this.prisma.registration.create({
      data: {
        ...createRegistrationDto,
        requestedBy,
        status: 'pendiente',
      },
      include: {
        team: {
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
                name: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        category: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Registration created: Team ${team.name} -> Tournament ${tournament.name}, Category ${category.name}`,
    );

    return registration;
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.tournamentId) {
      where.tournamentId = filters.tournamentId;
    }

    if (filters?.teamId) {
      where.teamId = filters.teamId;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [registrations, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              sport: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      data: registrations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        team: {
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
                name: true,
              },
            },
            members: {
              include: {
                profile: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        tournament: {
          include: {
            sport: true,
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        category: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
            zones: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    return registration;
  }

  async approve(id: string, approvedBy: string) {
    const registration = await this.findOne(id);

    if (registration.status !== 'pendiente') {
      throw new BadRequestException(
        `Cannot approve registration with status: ${registration.status}`,
      );
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: {
        status: 'aprobada',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Registration approved: ${id}`);

    return updatedRegistration;
  }

  async reject(id: string, approvedBy: string, rejectionReason?: string) {
    const registration = await this.findOne(id);

    if (registration.status !== 'pendiente') {
      throw new BadRequestException(
        `Cannot reject registration with status: ${registration.status}`,
      );
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: {
        status: 'rechazada',
        approvedBy,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || 'Rejected by administrator',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Registration rejected: ${id}`);

    return updatedRegistration;
  }

  async remove(id: string) {
    const registration = await this.findOne(id);

    // Solo permitir eliminar si está pendiente o rechazada
    if (
      registration.status === 'aprobada' ||
      registration.status === 'pagada'
    ) {
      throw new BadRequestException(
        'Cannot delete approved or paid registration',
      );
    }

    await this.prisma.registration.delete({
      where: { id },
    });

    this.logger.log(`Registration deleted: ${id}`);

    return { message: 'Registration deleted successfully' };
  }
}
