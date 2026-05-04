import { Injectable } from '@nestjs/common';
import { Debt, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateDiscountInput,
  DiscountRecord,
  IDiscountRepository,
  ListDiscountsFilter,
} from '../../application/ports/discount-repository.port';
import {
  DISCOUNT_METADATA_KIND,
  toPersistedDebtAmount,
} from '../../domain/rules/discount-amount.rules';

/**
 * Repositorio de descuentos manuales (RN-020). Modelado sobre `Debt` con:
 *   - `type = OTHER_MANUAL`
 *   - `metadata.kind = 'DISCOUNT'`
 *   - `originAmount` y `currentBalance` NEGATIVOS (crédito a favor).
 *
 * No agrega tablas — reutiliza el modelo `Debt` de PR0.
 */
@Injectable()
export class PrismaDiscountRepository implements IDiscountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDiscountInput): Promise<DiscountRecord> {
    const persistedAmount = toPersistedDebtAmount(input.amount);
    const metadata: Prisma.JsonObject = {
      ...(input.metadata ?? {}),
      kind: DISCOUNT_METADATA_KIND,
    };

    return this.prisma.debt.create({
      data: {
        type: 'OTHER_MANUAL',
        status: 'APPROVED',
        concept: input.concept,
        originAmount: persistedAmount,
        currentBalance: persistedAmount,
        currency: input.currency ?? 'ARS',
        dueDate: input.dueDate ?? new Date(),
        teamId: input.teamId,
        notes: input.notes ?? null,
        metadata,
        parentDebtId: input.sourceDebtId ?? null,
        createdByProfileId: input.createdByProfileId,
      },
    });
  }

  findById(id: string): Promise<DiscountRecord | null> {
    return this.prisma.debt.findUnique({ where: { id } });
  }

  async list(filter: ListDiscountsFilter): Promise<DiscountRecord[]> {
    const where: Prisma.DebtWhereInput = {
      type: 'OTHER_MANUAL',
      // Filtro a nivel BD por shape de metadata (Postgres jsonb).
      metadata: { path: ['kind'], equals: DISCOUNT_METADATA_KIND },
    };
    if (filter.teamId) where.teamId = filter.teamId;
    if (!filter.includeCancelled) {
      where.status = { not: 'CANCELLED' };
    }
    return this.prisma.debt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(
    id: string,
    cancelledByProfileId: string,
    reason?: string,
  ): Promise<Debt> {
    // Audit transaccional: se actualiza la deuda y se inserta DebtAudit.
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.debt.findUnique({ where: { id } });
      if (!current) {
        throw new Error(`Discount ${id} not found at cancel`);
      }
      const updated = await tx.debt.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      await tx.debtAudit.create({
        data: {
          debtId: id,
          fromStatus: current.status,
          toStatus: 'CANCELLED',
          reason: reason ?? 'Descuento cancelado por admin',
          byProfileId: cancelledByProfileId,
        },
      });
      return updated;
    });
  }
}
