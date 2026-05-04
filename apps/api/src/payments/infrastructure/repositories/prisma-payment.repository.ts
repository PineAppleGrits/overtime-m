import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreatePaymentInput,
  IPaymentRepository,
  ListPaymentsFilter,
  PaymentWithRelations,
  UpdatePaymentInput,
} from '../../application/ports/payment-repository.port';

const paymentInclude = Prisma.validator<Prisma.PaymentInclude>()({
  profile: { select: { id: true, name: true, email: true } },
  registration: {
    select: {
      id: true,
      status: true,
      team: { select: { id: true, name: true } },
      tournament: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  },
  match: {
    select: {
      id: true,
      matchDate: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  },
  debt: {
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
      friendlyId: true,
      registrationId: true,
      matchId: true,
    },
  },
});

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePaymentInput): Promise<PaymentWithRelations> {
    const created = await this.prisma.payment.create({
      data: {
        debtId: input.debtId ?? null,
        registrationId: input.registrationId ?? null,
        matchId: input.matchId ?? null,
        profileId: input.profileId,
        amount: input.amount,
        currency: input.currency,
        method: input.method,
        status: input.status,
        providerPaymentId: input.providerPaymentId ?? null,
        providerResponse:
          (input.providerResponse as Prisma.InputJsonValue | undefined) ??
          Prisma.JsonNull,
      },
      include: paymentInclude,
    });
    return created as unknown as PaymentWithRelations;
  }

  async findById(id: string): Promise<PaymentWithRelations | null> {
    const found = await this.prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
    return (found as unknown as PaymentWithRelations) ?? null;
  }

  async findByProviderExternalReference(
    externalRef: string,
  ): Promise<PaymentWithRelations | null> {
    const found = await this.prisma.payment.findFirst({
      where: { id: externalRef },
      include: paymentInclude,
    });
    return (found as unknown as PaymentWithRelations) ?? null;
  }

  async findActiveForResource(resource: {
    debtId?: string;
    registrationId?: string;
    matchId?: string;
  }): Promise<PaymentWithRelations | null> {
    const where: Prisma.PaymentWhereInput = {
      status: { in: ['pendiente', 'procesando'] },
    };
    if (resource.debtId) where.debtId = resource.debtId;
    if (resource.registrationId) where.registrationId = resource.registrationId;
    if (resource.matchId) where.matchId = resource.matchId;
    if (
      !resource.debtId &&
      !resource.registrationId &&
      !resource.matchId
    ) {
      return null;
    }
    const found = await this.prisma.payment.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: paymentInclude,
    });
    return (found as unknown as PaymentWithRelations) ?? null;
  }

  async list(filter: ListPaymentsFilter): Promise<{
    data: PaymentWithRelations[];
    total: number;
  }> {
    const where: Prisma.PaymentWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.method) where.method = filter.method;
    if (filter.registrationId) where.registrationId = filter.registrationId;
    if (filter.matchId) where.matchId = filter.matchId;
    if (filter.debtId) where.debtId = filter.debtId;
    if (filter.profileId) where.profileId = filter.profileId;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = filter.sortBy ?? 'createdAt';
    const sortOrder = filter.sortOrder ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: paymentInclude,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: data as unknown as PaymentWithRelations[], total };
  }

  async update(
    id: string,
    patch: UpdatePaymentInput,
  ): Promise<PaymentWithRelations> {
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: patch.status,
        providerPaymentId: patch.providerPaymentId,
        providerResponse:
          patch.providerResponse === undefined
            ? undefined
            : (patch.providerResponse as Prisma.InputJsonValue | null) ??
              Prisma.JsonNull,
        processedAt: patch.processedAt,
      },
      include: paymentInclude,
    });
    return updated as unknown as PaymentWithRelations;
  }

  async getSummary(filter: { startDate?: Date; endDate?: Date }): Promise<{
    totalPayments: number;
    statusBreakdown: Record<string, number>;
    methodBreakdown: Record<string, number>;
    totalCompletedAmount: number;
  }> {
    const where: Prisma.PaymentWhereInput = {};
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate)
        (where.createdAt as Prisma.DateTimeFilter).gte = filter.startDate;
      if (filter.endDate)
        (where.createdAt as Prisma.DateTimeFilter).lte = filter.endDate;
    }

    const [totalPayments, statusCounts, methodCounts, completedAgg] =
      await Promise.all([
        this.prisma.payment.count({ where }),
        this.prisma.payment.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        this.prisma.payment.groupBy({
          by: ['method'],
          where,
          _count: true,
        }),
        this.prisma.payment.aggregate({
          where: { ...where, status: 'procesado' },
          _sum: { amount: true },
        }),
      ]);

    const statusBreakdown = statusCounts.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {},
    );
    const methodBreakdown = methodCounts.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.method] = item._count;
        return acc;
      },
      {},
    );

    return {
      totalPayments,
      statusBreakdown,
      methodBreakdown,
      totalCompletedAmount: completedAgg._sum.amount ?? 0,
    };
  }
}
