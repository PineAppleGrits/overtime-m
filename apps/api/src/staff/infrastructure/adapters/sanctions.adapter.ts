import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  ISanctionsPort,
  MarkAjcAppliedInput,
  SanctionRow,
} from '../../application/ports/sanctions.port';

/**
 * Adapter del port `ISanctionsPort` con acceso directo a la tabla `sanctions`.
 *
 * Decisión: NO acoplamos a un módulo Sanctions (W3.3) — leemos/escribimos
 * directo via Prisma. Cuando W3.3 madure, este adapter pasa a usar el
 * `SanctionsService` sin cambiar el contrato del port.
 *
 * Persistencia del rastro AJC: como el modelo `Sanction` no tiene `metadata`
 * jsonb en el schema actual, anexamos el rastro al campo `notes` en formato
 * legible. La info estructurada (fechasFreed, refereeSalary, ajcDebtId) queda
 * además en la `Debt.metadata` AJC creada por W2.1.
 */
@Injectable()
export class SanctionsAdapter implements ISanctionsPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SanctionRow | null> {
    const found = await this.prisma.sanction.findUnique({ where: { id } });
    if (!found) return null;
    return {
      id: found.id,
      status: found.status,
      kind: found.kind,
      targetProfileId: found.targetProfileId,
      startsAt: found.startsAt,
      endsAt: found.endsAt,
      notes: found.notes,
    };
  }

  async markAjcApplied(input: MarkAjcAppliedInput): Promise<void> {
    const stamp = `[AJC ${input.appliedAt.toISOString()}] fechasFreed=${input.fechasFreed} refereeSalary=$${input.refereeSalary} amount=$${input.ajcAmount} debtId=${input.ajcDebtId} appliedBy=${input.appliedBy}`;
    const current = await this.prisma.sanction.findUnique({
      where: { id: input.sanctionId },
      select: { notes: true },
    });
    const newNotes = current?.notes ? `${current.notes}\n${stamp}` : stamp;
    await this.prisma.sanction.update({
      where: { id: input.sanctionId },
      data: { notes: newNotes },
    });
  }
}
