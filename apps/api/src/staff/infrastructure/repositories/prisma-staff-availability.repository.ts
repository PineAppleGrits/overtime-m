import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AvailabilityRow } from '../../application/ports/staff-repository.port';
import {
  AvailabilitySlotInput,
  IStaffAvailabilityRepository,
} from '../../application/ports/staff-availability-repository.port';

@Injectable()
export class PrismaStaffAvailabilityRepository
  implements IStaffAvailabilityRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async replaceForStaff(
    staffId: string,
    slots: AvailabilitySlotInput[],
  ): Promise<AvailabilityRow[]> {
    await this.prisma.$transaction([
      this.prisma.staffAvailability.deleteMany({ where: { staffId } }),
      this.prisma.staffAvailability.createMany({
        data: slots.map((s) => ({
          staffId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }),
    ]);
    const refreshed = await this.prisma.staffAvailability.findMany({
      where: { staffId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return refreshed.map((r) => ({
      id: r.id,
      staffId: r.staffId,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
    }));
  }

  async findByStaff(staffId: string): Promise<AvailabilityRow[]> {
    const rows = await this.prisma.staffAvailability.findMany({
      where: { staffId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      staffId: r.staffId,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
    }));
  }

  async findStaffAvailableAt(input: {
    dayOfWeek: number;
    time: string;
    type?: string;
  }): Promise<string[]> {
    const where: Record<string, unknown> = {
      deletedAt: null,
      isActive: true,
      availability: {
        some: {
          dayOfWeek: input.dayOfWeek,
          startTime: { lte: input.time },
          endTime: { gte: input.time },
        },
      },
    };
    if (input.type) where.type = input.type;

    const rows = await this.prisma.staff.findMany({
      where,
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
