import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateDebtInput,
  DebtWithRelations,
  FindChildDebtForDayFilter,
  FindOverdueDebtsFilter,
  IDebtRepository,
  ListDebtsFilter,
} from '../../application/ports/debt-repository.port';
import { DebtState } from '../../domain/entities/debt.entity';

const debtInclude = Prisma.validator<Prisma.DebtInclude>()({
  payments: {
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      profileId: true,
      processedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },
  childDebts: {
    where: { deletedAt: null },
    select: {
      id: true,
      type: true,
      status: true,
      concept: true,
      originAmount: true,
      currentBalance: true,
      dueDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },
  audits: {
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      byProfileId: true,
      at: true,
    },
    orderBy: { at: 'desc' },
  },
});

@Injectable()
export class PrismaDebtRepository implements IDebtRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDebtInput): Promise<DebtWithRelations> {
    return this.prisma.debt.create({
      data: {
        type: input.type,
        status: input.status ?? 'APPROVED',
        concept: input.concept,
        originAmount: input.originAmount,
        currentBalance: input.currentBalance,
        currency: input.currency,
        dueDate: input.dueDate,
        teamId: input.teamId ?? null,
        profileId: input.profileId ?? null,
        registrationId: input.registrationId ?? null,
        matchId: input.matchId ?? null,
        friendlyId: input.friendlyId ?? null,
        sanctionId: input.sanctionId ?? null,
        parentDebtId: input.parentDebtId ?? null,
        notes: input.notes ?? null,
        metadata:
          (input.metadata as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
        createdByProfileId: input.createdByProfileId,
      },
      include: debtInclude,
    });
  }

  async findById(id: string): Promise<DebtWithRelations | null> {
    return this.prisma.debt.findFirst({
      where: { id, deletedAt: null },
      include: debtInclude,
    });
  }

  async list(
    filter: ListDebtsFilter,
  ): Promise<{ data: DebtWithRelations[]; total: number }> {
    const where: Prisma.DebtWhereInput = {
      deletedAt: null,
    };

    // Visibility (no-admin): limitar a profile o teams del usuario.
    if (
      filter.visibleProfileId !== undefined ||
      filter.visibleTeamIds !== undefined
    ) {
      const orClauses: Prisma.DebtWhereInput[] = [];
      if (filter.visibleProfileId) {
        orClauses.push({ profileId: filter.visibleProfileId });
      }
      if (filter.visibleTeamIds && filter.visibleTeamIds.length > 0) {
        orClauses.push({ teamId: { in: filter.visibleTeamIds } });
      }
      // Si el usuario no tiene visibilidad sobre nada, no devolvemos nada.
      where.OR = orClauses.length > 0 ? orClauses : [{ id: '__none__' }];
    }

    if (filter.teamId) where.teamId = filter.teamId;
    if (filter.profileId) where.profileId = filter.profileId;
    if (filter.status) where.status = filter.status;
    if (filter.statuses) where.status = { in: filter.statuses };
    if (filter.type) where.type = filter.type;

    if (filter.from || filter.to) {
      where.dueDate = {};
      if (filter.from) where.dueDate.gte = filter.from;
      if (filter.to) where.dueDate.lte = filter.to;
    }

    if (filter.overdueOnly) {
      const now = new Date();
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        { status: { in: ['APPROVED', 'PARTIALLY_PAID'] } },
        { currentBalance: { gt: 0 } },
        { dueDate: { lt: now } },
      ];
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.debt.findMany({
        where,
        include: debtInclude,
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.debt.count({ where }),
    ]);

    return { data, total };
  }

  async updateState(
    id: string,
    patch: Partial<DebtState>,
  ): Promise<DebtWithRelations> {
    const data: Prisma.DebtUpdateInput = {};
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.concept !== undefined) data.concept = patch.concept;
    if (patch.currentBalance !== undefined) {
      data.currentBalance = patch.currentBalance;
    }
    if (patch.notes !== undefined) data.notes = patch.notes;
    if (patch.dueDate !== undefined) data.dueDate = patch.dueDate;
    if (patch.metadata !== undefined) {
      data.metadata =
        patch.metadata === null
          ? Prisma.JsonNull
          : (patch.metadata as Prisma.InputJsonValue);
    }

    return this.prisma.debt.update({
      where: { id },
      data,
      include: debtInclude,
    });
  }

  async changeStatus(
    id: string,
    fromStatus: Parameters<IDebtRepository['changeStatus']>[1],
    toStatus: Parameters<IDebtRepository['changeStatus']>[2],
    byProfileId: string,
    reason?: string,
  ): Promise<DebtWithRelations> {
    // Transacción: update + audit log atómicos.
    return this.prisma.$transaction(async (tx) => {
      await tx.debtAudit.create({
        data: {
          debtId: id,
          fromStatus,
          toStatus,
          reason: reason ?? null,
          byProfileId,
        },
      });
      return tx.debt.update({
        where: { id },
        data: { status: toStatus },
        include: debtInclude,
      });
    });
  }

  async applyPayment(
    id: string,
    paidAmount: Prisma.Decimal,
    paidByProfileId: string,
  ): Promise<DebtWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          status: true,
          currentBalance: true,
        },
      });
      if (!debt) {
        // Caller ya validó, pero double-check defensivo.
        throw new Error(`Debt ${id} no encontrada (posible race)`);
      }

      const newBalance = debt.currentBalance.minus(paidAmount);
      const fullyPaid = newBalance.lessThanOrEqualTo(0);
      const newStatus = fullyPaid ? 'PAID' : 'PARTIALLY_PAID';

      // Audit log del cambio de estado (si hay)
      if (newStatus !== debt.status) {
        await tx.debtAudit.create({
          data: {
            debtId: id,
            fromStatus: debt.status,
            toStatus: newStatus,
            reason: 'Pago aplicado',
            byProfileId: paidByProfileId,
          },
        });
      }

      return tx.debt.update({
        where: { id },
        data: {
          currentBalance: fullyPaid ? new Prisma.Decimal(0) : newBalance,
          status: newStatus,
        },
        include: debtInclude,
      });
    });
  }

  async findOverdue(
    filter: FindOverdueDebtsFilter,
  ): Promise<DebtWithRelations[]> {
    const where: Prisma.DebtWhereInput = {
      deletedAt: null,
      status: { in: ['APPROVED', 'PARTIALLY_PAID'] },
      currentBalance: { gt: 0 },
      dueDate: { lt: filter.beforeDate },
    };

    if (filter.types && filter.types.length > 0) {
      where.type = { in: filter.types };
    }
    if (filter.excludeTypes && filter.excludeTypes.length > 0) {
      where.type = { notIn: filter.excludeTypes };
    }

    return this.prisma.debt.findMany({
      where,
      include: debtInclude,
      take: filter.take ?? 500,
      orderBy: { dueDate: 'asc' },
    });
  }

  async hasChildDebtForDay(
    filter: FindChildDebtForDayFilter,
  ): Promise<boolean> {
    const found = await this.prisma.debt.findFirst({
      where: {
        deletedAt: null,
        parentDebtId: filter.parentDebtId,
        type: filter.type,
        // Match exacto sobre metadata.dayKey
        metadata: {
          path: ['dayKey'],
          equals: filter.dayKey,
        } as Prisma.JsonNullableFilter<'Debt'>,
      },
      select: { id: true },
    });
    return found !== null;
  }

  async findOutstandingForTeam(
    teamId: string,
    now: Date,
  ): Promise<DebtWithRelations[]> {
    return this.prisma.debt.findMany({
      where: {
        deletedAt: null,
        teamId,
        status: { in: ['APPROVED', 'PARTIALLY_PAID'] },
        currentBalance: { gt: 0 },
        dueDate: { lt: now },
      },
      include: debtInclude,
      orderBy: { dueDate: 'asc' },
    });
  }
}
