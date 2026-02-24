import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateStaffDto,
  StaffType,
  UpdateStaffDto,
  SetAvailabilityDto,
  AssignStaffToMatchDto,
  PaginationDto,
} from '@overtime-mono/shared';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createStaffDto: CreateStaffDto) {
    // Si se proporciona profileId, verificar que existe y no tiene staff asociado
    if (createStaffDto.profileId) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: createStaffDto.profileId },
      });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      const existingStaff = await this.prisma.staff.findUnique({
        where: { profileId: createStaffDto.profileId },
      });

      if (existingStaff) {
        throw new ConflictException('Profile already has a staff record');
      }
    }

    const staff = await this.prisma.staff.create({
      data: createStaffDto,
      include: {
        availability: true,
        matchStaff: {
          include: {
            match: {
              select: {
                id: true,
                matchDate: true,
                status: true,
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    this.logger.log(`Staff created: ${staff.firstName} ${staff.lastName}`);
    return staff;
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: { type?: StaffType; isActive?: boolean },
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          availability: true,
          _count: {
            select: {
              matchStaff: true,
            },
          },
        },
      }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      data: staff,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id, deletedAt: null },
      include: {
        availability: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        matchStaff: {
          include: {
            match: {
              include: {
                homeTeam: { select: { id: true, name: true, logoUrl: true } },
                awayTeam: { select: { id: true, name: true, logoUrl: true } },
                venue: true,
                category: {
                  include: {
                    tournament: { select: { id: true, name: true } },
                  },
                },
              },
            },
            assignor: {
              select: { id: true, name: true },
            },
          },
          orderBy: {
            match: { matchDate: 'desc' },
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    await this.findOne(id);

    const staff = await this.prisma.staff.update({
      where: { id },
      data: updateStaffDto,
      include: {
        availability: true,
        _count: {
          select: {
            matchStaff: true,
          },
        },
      },
    });

    this.logger.log(`Staff updated: ${id}`);
    return staff;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Staff deleted: ${id}`);
    return { message: 'Staff deleted successfully' };
  }

  /**
   * Configurar disponibilidad horaria del staff
   */
  async setAvailability(staffId: string, setAvailabilityDto: SetAvailabilityDto) {
    await this.findOne(staffId);

    // Validar que las franjas no se superpongan
    const slots = setAvailabilityDto.availability;
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i].dayOfWeek === slots[j].dayOfWeek) {
          if (this.timeSlotsOverlap(slots[i], slots[j])) {
            throw new BadRequestException(
              `Time slots overlap on day ${slots[i].dayOfWeek}`,
            );
          }
        }
      }
    }

    // Eliminar disponibilidad existente y crear nueva
    await this.prisma.$transaction([
      this.prisma.staffAvailability.deleteMany({
        where: { staffId },
      }),
      this.prisma.staffAvailability.createMany({
        data: slots.map((slot) => ({
          staffId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      }),
    ]);

    this.logger.log(`Availability set for staff: ${staffId}`);
    return this.findOne(staffId);
  }

  /**
   * Obtener staff disponible para una fecha/hora específica
   */
  async findAvailable(date: Date, type?: StaffType) {
    const dayOfWeek = date.getDay();
    const timeStr = date.toTimeString().slice(0, 5); // HH:mm

    const where: any = {
      deletedAt: null,
      isActive: true,
      availability: {
        some: {
          dayOfWeek,
          startTime: { lte: timeStr },
          endTime: { gte: timeStr },
        },
      },
    };

    if (type) {
      where.type = type;
    }

    const availableStaff = await this.prisma.staff.findMany({
      where,
      include: {
        availability: {
          where: {
            dayOfWeek,
          },
        },
        _count: {
          select: {
            matchStaff: {
              where: {
                match: {
                  matchDate: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lt: new Date(date.setHours(23, 59, 59, 999)),
                  },
                  status: { notIn: ['cancelado', 'finalizado'] },
                },
              },
            },
          },
        },
      },
    });

    return availableStaff;
  }

  /**
   * Asignar staff a un partido
   */
  async assignToMatch(
    matchId: string,
    dto: AssignStaffToMatchDto,
    assignedById: string,
  ) {
    // Verificar que el partido existe
    const match = await this.prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Verificar que el staff existe
    const staff = await this.findOne(dto.staffId);

    // Verificar que el tipo de staff coincide con el rol
    if (staff.type !== dto.role) {
      throw new BadRequestException(
        `Staff type (${staff.type}) does not match role (${dto.role})`,
      );
    }

    // Verificar que no hay otro staff asignado a ese rol
    const existingAssignment = await this.prisma.matchStaff.findFirst({
      where: {
        matchId,
        role: dto.role,
        status: 'assigned',
      },
    });

    if (existingAssignment) {
      throw new ConflictException(`A ${dto.role} is already assigned to this match`);
    }

    // Verificar disponibilidad del staff para esa fecha
    const matchDate = new Date(match.matchDate);
    const dayOfWeek = matchDate.getDay();
    const matchTime = match.matchTime || '00:00';

    const hasAvailability = await this.prisma.staffAvailability.findFirst({
      where: {
        staffId: dto.staffId,
        dayOfWeek,
        startTime: { lte: matchTime },
        endTime: { gte: matchTime },
      },
    });

    if (!hasAvailability) {
      throw new BadRequestException('Staff is not available at this time');
    }

    // Verificar que el staff no tiene otro partido asignado a la misma hora
    const conflictingAssignment = await this.prisma.matchStaff.findFirst({
      where: {
        staffId: dto.staffId,
        status: 'assigned',
        match: {
          matchDate: match.matchDate,
          matchTime: match.matchTime,
          status: { notIn: ['cancelado', 'finalizado'] },
        },
      },
    });

    if (conflictingAssignment) {
      throw new ConflictException('Staff has another assignment at this time');
    }

    const assignment = await this.prisma.matchStaff.create({
      data: {
        matchId,
        staffId: dto.staffId,
        role: dto.role,
        status: 'assigned',
        assignedBy: assignedById,
        assignedAt: new Date(),
      },
      include: {
        staff: true,
        match: {
          select: {
            id: true,
            matchDate: true,
            matchTime: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
    });

    this.logger.log(
      `Staff ${dto.staffId} assigned to match ${matchId} as ${dto.role}`,
    );
    return assignment;
  }

  /**
   * Remover staff de un partido
   */
  async removeFromMatch(matchId: string, staffId: string) {
    const assignment = await this.prisma.matchStaff.findFirst({
      where: {
        matchId,
        staffId,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.matchStaff.delete({
      where: { id: assignment.id },
    });

    this.logger.log(`Staff ${staffId} removed from match ${matchId}`);
    return { message: 'Staff removed from match successfully' };
  }

  /**
   * Obtener partidos asignados a un staff
   */
  async getAssignedMatches(staffId: string, status?: string) {
    await this.findOne(staffId);

    const where: any = {
      staffId,
      status: 'assigned',
    };

    if (status) {
      where.match = { status };
    }

    const assignments = await this.prisma.matchStaff.findMany({
      where,
      include: {
        match: {
          include: {
            homeTeam: { select: { id: true, name: true, logoUrl: true } },
            awayTeam: { select: { id: true, name: true, logoUrl: true } },
            venue: true,
            category: {
              include: {
                tournament: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: {
        match: { matchDate: 'asc' },
      },
    });

    return assignments;
  }

  private timeSlotsOverlap(
    slot1: { startTime: string; endTime: string },
    slot2: { startTime: string; endTime: string },
  ): boolean {
    const start1 = this.timeToMinutes(slot1.startTime);
    const end1 = this.timeToMinutes(slot1.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);

    return start1 < end2 && end1 > start2;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
