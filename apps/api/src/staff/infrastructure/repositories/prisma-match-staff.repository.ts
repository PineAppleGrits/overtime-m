import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateMatchStaffInput,
  IMatchStaffRepository,
  MatchForStaffAssignment,
  MatchStaffRow,
  MatchSummary,
} from '../../application/ports/match-staff-repository.port';

const TERMINAL_MATCH_STATUSES = ['cancelado', 'finalizado'];

@Injectable()
export class PrismaMatchStaffRepository implements IMatchStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateMatchStaffInput): Promise<MatchStaffRow> {
    const created = await this.prisma.matchStaff.create({
      data: {
        matchId: input.matchId,
        staffId: input.staffId,
        role: input.role,
        status: input.status,
        assignedBy: input.assignedBy ?? null,
        assignedAt: input.assignedAt ?? null,
      },
    });
    return toRow(created);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.matchStaff.delete({ where: { id } });
  }

  async findByMatchAndStaffAndRole(
    matchId: string,
    staffId: string,
    role: string,
    statuses?: string[],
  ): Promise<MatchStaffRow | null> {
    const found = await this.prisma.matchStaff.findFirst({
      where: {
        matchId,
        staffId,
        role,
        ...(statuses && statuses.length > 0 ? { status: { in: statuses } } : {}),
      },
    });
    return found ? toRow(found) : null;
  }

  async findByMatchAndStaff(
    matchId: string,
    staffId: string,
  ): Promise<MatchStaffRow | null> {
    const found = await this.prisma.matchStaff.findFirst({
      where: { matchId, staffId },
    });
    return found ? toRow(found) : null;
  }

  async findByMatch(matchId: string): Promise<MatchStaffRow[]> {
    const rows = await this.prisma.matchStaff.findMany({ where: { matchId } });
    return rows.map(toRow);
  }

  async findConflictingAssignment(input: {
    staffId: string;
    matchDate: Date;
    matchTime: string | null;
    excludeMatchId?: string;
  }): Promise<MatchStaffRow | null> {
    const found = await this.prisma.matchStaff.findFirst({
      where: {
        staffId: input.staffId,
        status: { in: ['assigned', 'applied'] },
        ...(input.excludeMatchId ? { matchId: { not: input.excludeMatchId } } : {}),
        match: {
          matchDate: input.matchDate,
          matchTime: input.matchTime,
          status: { notIn: TERMINAL_MATCH_STATUSES },
        },
      },
    });
    return found ? toRow(found) : null;
  }

  async findAssignmentsForStaff(
    staffId: string,
    options: { matchStatus?: string; activeOnly?: boolean } = {},
  ): Promise<Array<MatchStaffRow & { match: MatchSummary }>> {
    const rows = await this.prisma.matchStaff.findMany({
      where: {
        staffId,
        ...(options.activeOnly ? { status: { in: ['assigned', 'applied'] } } : {}),
        ...(options.matchStatus ? { match: { status: options.matchStatus } } : {}),
      },
      include: {
        match: {
          select: {
            id: true,
            matchDate: true,
            matchTime: true,
            status: true,
          },
        },
      },
      orderBy: { match: { matchDate: 'asc' } },
    });

    return rows.map((r) => ({
      ...toRow(r),
      match: {
        id: r.match.id,
        matchDate: r.match.matchDate,
        matchTime: r.match.matchTime,
        status: r.match.status,
      },
    }));
  }

  async findMatch(matchId: string): Promise<MatchForStaffAssignment | null> {
    const m = await this.prisma.match.findFirst({
      where: { id: matchId, deletedAt: null },
      select: { id: true, matchDate: true, matchTime: true, status: true },
    });
    return m;
  }
}

function toRow(raw: {
  id: string;
  matchId: string;
  staffId: string;
  role: string;
  status: string;
  assignedBy: string | null;
  assignedAt: Date | null;
  createdAt: Date;
}): MatchStaffRow {
  return {
    id: raw.id,
    matchId: raw.matchId,
    staffId: raw.staffId,
    role: raw.role,
    status: raw.status,
    assignedBy: raw.assignedBy,
    assignedAt: raw.assignedAt,
    createdAt: raw.createdAt,
  };
}
