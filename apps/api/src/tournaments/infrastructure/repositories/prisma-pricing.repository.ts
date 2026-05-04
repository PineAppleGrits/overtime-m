import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreatePricingInput,
  IPricingRepository,
  PricingRecord,
  UpdatePricingInput,
} from '../../application/ports/pricing-repository.port';

@Injectable()
export class PrismaPricingRepository implements IPricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByTournament(tournamentId: string): Promise<PricingRecord[]> {
    return this.prisma.tournamentRegistrationPricing.findMany({
      where: { tournamentId },
      orderBy: { validFrom: 'asc' },
    });
  }

  findById(id: string): Promise<PricingRecord | null> {
    return this.prisma.tournamentRegistrationPricing.findUnique({
      where: { id },
    });
  }

  create(input: CreatePricingInput): Promise<PricingRecord> {
    return this.prisma.tournamentRegistrationPricing.create({
      data: {
        tournamentId: input.tournamentId,
        validFrom: input.validFrom,
        validTo: input.validTo,
        entryFeeAmount: input.entryFeeAmount,
        currency: input.currency ?? 'ARS',
      },
    });
  }

  update(id: string, input: UpdatePricingInput): Promise<PricingRecord> {
    return this.prisma.tournamentRegistrationPricing.update({
      where: { id },
      data: {
        ...(input.validFrom !== undefined
          ? { validFrom: input.validFrom }
          : {}),
        ...(input.validTo !== undefined ? { validTo: input.validTo } : {}),
        ...(input.entryFeeAmount !== undefined
          ? { entryFeeAmount: input.entryFeeAmount }
          : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tournamentRegistrationPricing.delete({ where: { id } });
  }
}
