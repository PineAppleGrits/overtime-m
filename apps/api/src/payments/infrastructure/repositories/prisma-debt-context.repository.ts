import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  DebtSummaryForPayment,
  IDebtContextPort,
} from '../../application/ports/debt-context.port';

@Injectable()
export class PrismaDebtContextRepository implements IDebtContextPort {
  constructor(private readonly prisma: PrismaService) {}

  async getById(debtId: string): Promise<DebtSummaryForPayment | null> {
    const debt = await this.prisma.debt.findUnique({
      where: { id: debtId },
      select: {
        id: true,
        type: true,
        status: true,
        concept: true,
        currentBalance: true,
        originAmount: true,
        currency: true,
        teamId: true,
        profileId: true,
        registrationId: true,
        matchId: true,
        friendlyId: true,
        metadata: true,
      },
    });
    if (!debt) return null;
    return debt;
  }

  async listByRegistrationId(
    registrationId: string,
  ): Promise<DebtSummaryForPayment[]> {
    const debts = await this.prisma.debt.findMany({
      where: { registrationId, deletedAt: null },
      select: {
        id: true,
        type: true,
        status: true,
        concept: true,
        currentBalance: true,
        originAmount: true,
        currency: true,
        teamId: true,
        profileId: true,
        registrationId: true,
        matchId: true,
        friendlyId: true,
        metadata: true,
      },
    });
    return debts;
  }

  /**
   * RN-017 — true si existe una INSURANCE PAID con `metadata.year === year`
   * para este profile (en cualquier registration). Si `sportId` se pasa,
   * filtramos también por `metadata.sportId`.
   *
   * V1 simplificada: chequea solo `metadata.year`. Cuando se cierre la
   * decisión sobre `coverageEndDate` / `validUntil`, refinar.
   */
  async hasReusableInsurance(input: {
    profileId: string;
    sportId?: string;
    year: number;
  }): Promise<boolean> {
    const where: Prisma.DebtWhereInput = {
      type: 'INSURANCE',
      status: 'PAID',
      profileId: input.profileId,
      deletedAt: null,
      metadata: {
        path: ['year'],
        equals: input.year,
      },
    };
    if (input.sportId) {
      where.AND = [
        {
          metadata: {
            path: ['sportId'],
            equals: input.sportId,
          },
        },
      ];
    }
    const count = await this.prisma.debt.count({ where });
    return count > 0;
  }
}
