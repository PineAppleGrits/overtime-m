import { Injectable } from '@nestjs/common';
import { TournamentRegistrationPricing } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreatePricingInput,
  IPricingRepository,
  ListPricingFilter,
  PricingRecord,
  UpdatePricingInput,
} from '../../application/ports/pricing-repository.port';
import {
  decodeCurrency,
  encodeCurrency,
  PaymentMethod,
} from '../../domain/rules/payment-method.rules';

/**
 * Repositorio de pricing periods con awareness de la dimensión `paymentMethod`.
 *
 * IMPORTANTE — modelado sin tocar schema (PR0 cerrado):
 *
 * El campo `paymentMethod` se codifica dentro de `currency` con el formato
 * `"<CCY>"` (sin método, default) o `"<CCY>:<method>"` (`cash`/`transfer`/
 * `card`). Esto permite resolver RN-048 (precio variable por período × método)
 * sin agregar columnas. La codificación es transparente para use-cases:
 * al persistir se encoda; al leer se decoda y se devuelve `paymentMethod`
 * como campo separado.
 *
 * Filas legacy (sin sufijo) se interpretan como `paymentMethod=null`
 * (aplican a todos los métodos).
 *
 * TODO: schema-v2 — paymentMethod columnar. Cuando se migre, este repo debe
 * eliminar el encode/decode y leer/escribir contra una columna dedicada.
 */
@Injectable()
export class PrismaPricingRepository implements IPricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByTournament(filter: ListPricingFilter): Promise<PricingRecord[]> {
    const rows = await this.prisma.tournamentRegistrationPricing.findMany({
      where: { tournamentId: filter.tournamentId },
      orderBy: { validFrom: 'asc' },
    });
    const decoded = rows.map((r) => this.decodeRow(r));
    if (filter.paymentMethod === undefined) return decoded;
    return decoded.filter((r) => r.paymentMethod === filter.paymentMethod);
  }

  async findById(id: string): Promise<PricingRecord | null> {
    const row = await this.prisma.tournamentRegistrationPricing.findUnique({
      where: { id },
    });
    return row ? this.decodeRow(row) : null;
  }

  findRawById(id: string): Promise<TournamentRegistrationPricing | null> {
    return this.prisma.tournamentRegistrationPricing.findUnique({
      where: { id },
    });
  }

  async create(input: CreatePricingInput): Promise<PricingRecord> {
    const ccy = (input.currency ?? 'ARS').toUpperCase();
    const method = input.paymentMethod ?? null;
    const created = await this.prisma.tournamentRegistrationPricing.create({
      data: {
        tournamentId: input.tournamentId,
        validFrom: input.validFrom,
        validTo: input.validTo,
        entryFeeAmount: input.entryFeeAmount,
        currency: encodeCurrency(ccy, method),
      },
    });
    return this.decodeRow(created);
  }

  async update(id: string, input: UpdatePricingInput): Promise<PricingRecord> {
    // Para updates parciales del par (currency, paymentMethod), debemos leer
    // primero y reencodar — porque el schema solo tiene `currency` columnar.
    const data: {
      validFrom?: Date;
      validTo?: Date;
      entryFeeAmount?: number;
      currency?: string;
    } = {};

    if (input.validFrom !== undefined) data.validFrom = input.validFrom;
    if (input.validTo !== undefined) data.validTo = input.validTo;
    if (input.entryFeeAmount !== undefined)
      data.entryFeeAmount = input.entryFeeAmount;

    if (input.currency !== undefined || input.paymentMethod !== undefined) {
      const current = await this.prisma.tournamentRegistrationPricing.findUnique(
        { where: { id } },
      );
      if (!current) {
        // El use-case ya valida existencia, pero por defensa:
        throw new Error(`Pricing period ${id} not found in repository update`);
      }
      const decoded = decodeCurrency(current.currency);
      const newCcy =
        input.currency !== undefined
          ? input.currency.toUpperCase()
          : decoded.currency;
      const newMethod: PaymentMethod | null =
        input.paymentMethod !== undefined
          ? input.paymentMethod
          : decoded.paymentMethod;
      data.currency = encodeCurrency(newCcy, newMethod);
    }

    const updated = await this.prisma.tournamentRegistrationPricing.update({
      where: { id },
      data,
    });
    return this.decodeRow(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tournamentRegistrationPricing.delete({ where: { id } });
  }

  private decodeRow(row: TournamentRegistrationPricing): PricingRecord {
    const { currency, paymentMethod } = decodeCurrency(row.currency);
    return {
      id: row.id,
      tournamentId: row.tournamentId,
      validFrom: row.validFrom,
      validTo: row.validTo,
      entryFeeAmount: row.entryFeeAmount,
      currency,
      paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
