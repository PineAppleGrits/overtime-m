import { Injectable } from '@nestjs/common';
import { DebtAudit } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateDebtAuditInput,
  IDebtAuditRepository,
} from '../../application/ports/debt-audit-repository.port';

@Injectable()
export class PrismaDebtAuditRepository implements IDebtAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDebtAuditInput): Promise<DebtAudit> {
    return this.prisma.debtAudit.create({
      data: {
        debtId: input.debtId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        reason: input.reason ?? null,
        byProfileId: input.byProfileId,
      },
    });
  }

  async listByDebt(debtId: string): Promise<DebtAudit[]> {
    return this.prisma.debtAudit.findMany({
      where: { debtId },
      orderBy: { at: 'desc' },
    });
  }
}
