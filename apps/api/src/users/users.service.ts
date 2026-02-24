import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { ProfileRole } from '@prisma/client';

const PRIVILEGED_ROLES: ProfileRole[] = [ProfileRole.master, ProfileRole.admin];

function assertCanSetRole(actorRole: string, newRole: ProfileRole): void {
  if (newRole === ProfileRole.master) {
    throw new ForbiddenException('Cannot create or assign master role');
  }
  if (actorRole === ProfileRole.admin && newRole === ProfileRole.admin) {
    throw new ForbiddenException('Admin cannot create or assign admin role');
  }
}

function assertAdminCanTouchTarget(
  actorRole: string,
  targetRole: ProfileRole,
): void {
  if (actorRole === 'admin' && PRIVILEGED_ROLES.includes(targetRole)) {
    throw new ForbiddenException(
      'Admin cannot modify or delete masters or other admins',
    );
  }
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, actorRole: string) {
    const role = (dto.role ?? ProfileRole.player) as ProfileRole;
    assertCanSetRole(actorRole, role);
    if (dto.email) {
      const existingEmail = await this.prisma.profile.findFirst({
        where: { email: dto.email, deletedAt: null },
      });
      if (existingEmail) {
        throw new ConflictException('Email already in use');
      }
    }
    if (dto.phone) {
      const existingPhone = await this.prisma.profile.findFirst({
        where: { phone: dto.phone, deletedAt: null },
      });
      if (existingPhone) {
        throw new ConflictException('Phone already in use');
      }
    }
    if (dto.documentNumber) {
      const existingDoc = await this.prisma.profile.findFirst({
        where: { documentNumber: dto.documentNumber, deletedAt: null },
      });
      if (existingDoc) {
        throw new ConflictException('Document number already in use');
      }
    }

    const profile = await this.prisma.profile.create({
      data: {
        email: dto.email ?? null,
        name: dto.name,
        phone: dto.phone ?? null,
        documentNumber: dto.documentNumber ?? null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        role,
      },
    });
    this.logger.log(`Profile created: ${profile.id}`);
    return profile;
  }

  private async getProfileForUpdateOrDelete(id: string, actorRole: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    assertAdminCanTouchTarget(actorRole, profile.role);
    return profile;
  }

  async findAll(search?: string, paginationDto?: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
    } = paginationDto ?? {};

    const where: {
      deletedAt: null;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        documentNumber?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      deletedAt: null,
    };
    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { documentNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const orderByKey =
      sortBy === 'name' || sortBy === 'email' || sortBy === 'createdAt'
        ? sortBy
        : 'name';

    const [data, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByKey]: sortOrder },
        select: {
          id: true,
          supabaseUserId: true,
          email: true,
          name: true,
          phone: true,
          documentNumber: true,
          dateOfBirth: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return profile;
  }

  async update(id: string, dto: UpdateUserDto, actorRole: string) {
    await this.getProfileForUpdateOrDelete(id, actorRole);

    if (dto.role !== undefined) {
      assertCanSetRole(actorRole, dto.role as ProfileRole);
    }

    if (dto.email !== undefined) {
      const existingEmail = await this.prisma.profile.findFirst({
        where: { email: dto.email, deletedAt: null, NOT: { id } },
      });
      if (existingEmail) {
        throw new ConflictException('Email already in use');
      }
    }
    if (dto.phone !== undefined && dto.phone) {
      const existingPhone = await this.prisma.profile.findFirst({
        where: { phone: dto.phone, deletedAt: null, NOT: { id } },
      });
      if (existingPhone) {
        throw new ConflictException('Phone already in use');
      }
    }
    if (dto.documentNumber !== undefined && dto.documentNumber) {
      const existingDoc = await this.prisma.profile.findFirst({
        where: {
          documentNumber: dto.documentNumber,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (existingDoc) {
        throw new ConflictException('Document number already in use');
      }
    }

    const data: {
      email?: string | null;
      name?: string;
      phone?: string | null;
      documentNumber?: string | null;
      dateOfBirth?: Date | null;
      role?: ProfileRole;
    } = {};
    if (dto.email !== undefined) data.email = dto.email ?? null;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone ?? null;
    if (dto.documentNumber !== undefined)
      data.documentNumber = dto.documentNumber ?? null;
    if (dto.dateOfBirth !== undefined)
      data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.role !== undefined) data.role = dto.role as ProfileRole;

    return this.prisma.profile.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, actorRole: string) {
    await this.getProfileForUpdateOrDelete(id, actorRole);
    await this.prisma.profile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Profile soft-deleted: ${id}`);
    return { message: 'User deleted successfully' };
  }
}
