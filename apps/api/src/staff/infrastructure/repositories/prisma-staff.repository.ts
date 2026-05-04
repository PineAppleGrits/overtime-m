import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StaffTypeValue } from '../../domain/entities/staff.entity';
import {
  AvailabilityRow,
  CreateStaffInput,
  IStaffRepository,
  ListStaffFilter,
  StaffRow,
  UpdateStaffInput,
} from '../../application/ports/staff-repository.port';

interface RawStaff {
  id: string;
  profileId: string | null;
  type: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  availability?: Array<{
    id: string;
    staffId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  _count?: { matchStaff: number };
}

function toRow(raw: RawStaff): StaffRow {
  return {
    id: raw.id,
    profileId: raw.profileId,
    type: raw.type as StaffTypeValue,
    firstName: raw.firstName,
    lastName: raw.lastName,
    phone: raw.phone,
    email: raw.email,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt,
    availability: (raw.availability ?? []).map(
      (a): AvailabilityRow => ({
        id: a.id,
        staffId: a.staffId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      }),
    ),
    assignmentsCount: raw._count?.matchStaff,
  };
}

@Injectable()
export class PrismaStaffRepository implements IStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateStaffInput): Promise<StaffRow> {
    const created = await this.prisma.staff.create({
      data: {
        type: input.type,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        email: input.email ?? null,
        profileId: input.profileId ?? null,
        isActive: input.isActive ?? true,
      },
      include: { availability: true },
    });
    return toRow(created as unknown as RawStaff);
  }

  async findById(id: string): Promise<StaffRow | null> {
    const found = await this.prisma.staff.findFirst({
      where: { id, deletedAt: null },
      include: {
        availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        _count: { select: { matchStaff: true } },
      },
    });
    return found ? toRow(found as unknown as RawStaff) : null;
  }

  async findByProfileId(profileId: string): Promise<StaffRow | null> {
    const found = await this.prisma.staff.findFirst({
      where: { profileId, deletedAt: null },
      include: { availability: true },
    });
    return found ? toRow(found as unknown as RawStaff) : null;
  }

  async list(filter: ListStaffFilter) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = filter.sortBy ?? 'createdAt';
    const sortOrder = filter.sortOrder ?? 'desc';

    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.type) where.type = filter.type;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;

    const [data, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          availability: true,
          _count: { select: { matchStaff: true } },
        },
      }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      data: data.map((d) => toRow(d as unknown as RawStaff)),
      total,
      page,
      limit,
    };
  }

  async update(id: string, patch: UpdateStaffInput): Promise<StaffRow> {
    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        type: patch.type,
        firstName: patch.firstName,
        lastName: patch.lastName,
        phone: patch.phone === undefined ? undefined : patch.phone,
        email: patch.email === undefined ? undefined : patch.email,
        isActive: patch.isActive,
      },
      include: {
        availability: true,
        _count: { select: { matchStaff: true } },
      },
    });
    return toRow(updated as unknown as RawStaff);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
