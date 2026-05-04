import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { IStaffCheckPort } from '../../application/ports/staff-check.port';

/**
 * Adapter que cuenta `MatchStaff` confirmados (status='assigned')
 * agrupados por `role`. Va directo a Prisma porque `StaffService` no
 * expone una facade pública para esta consulta puntual.
 */
@Injectable()
export class StaffCheckAdapter implements IStaffCheckPort {
  constructor(private readonly prisma: PrismaService) {}

  async countConfirmedStaff(matchId: string): Promise<{
    referees: number;
    tableOfficials: number;
  }> {
    const grouped = await this.prisma.matchStaff.groupBy({
      by: ['role'],
      where: { matchId, status: 'assigned' },
      _count: { _all: true },
    });
    const counts = { referees: 0, tableOfficials: 0 };
    for (const row of grouped) {
      if (row.role === 'referee') counts.referees = row._count._all;
      else if (row.role === 'table_official')
        counts.tableOfficials = row._count._all;
    }
    return counts;
  }
}
