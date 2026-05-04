import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessError, ErrorCode } from '../../../../common/errors';

export interface AutoBalanceTeamsOutput {
  categoryId: string;
  totalTeams: number;
  totalZones: number;
  /** Distribución final: zoneId → teamIds (incluye los ya asignados). */
  assignmentsByZone: Record<string, string[]>;
  /** Equipos efectivamente asignados ahora (no incluye los que ya estaban). */
  newAssignments: Array<{ zoneId: string; teamId: string }>;
}

/**
 * POST /api/v1/categories/:categoryId/zones/auto-balance
 *
 * Distribuye los equipos con `Registration` aprobada del torneo entre las
 * zonas existentes de la categoría (round-robin determinístico).
 *
 * Reglas:
 * - Solo admin (validado por el controller con `@Admin()`).
 * - La categoría debe tener al menos N zonas (N = `category.zonesCount`).
 *   Si tiene menos, lanzar `CATEGORY_TOO_MANY_ZONES`.
 * - Equipos ya asignados a una zona de la categoría no se re-asignan
 *   (idempotente respecto a una corrida previa).
 * - El orden del round-robin es por `Registration.createdAt` ASC para
 *   determinismo.
 */
@Injectable()
export class AutoBalanceTeamsUseCase {
  private readonly logger = new Logger(AutoBalanceTeamsUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(categoryId: string): Promise<AutoBalanceTeamsOutput> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      select: {
        id: true,
        tournamentId: true,
        zonesCount: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const zones = await this.prisma.zone.findMany({
      where: { categoryId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });

    if (zones.length === 0) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'La categoría no tiene zonas. Crear al menos 1 antes de auto-balancear.',
        HttpStatus.BAD_REQUEST,
        { categoryId },
      );
    }
    if (zones.length < category.zonesCount) {
      throw new BusinessError(
        ErrorCode.CATEGORY_TOO_MANY_ZONES,
        `La categoría tiene ${zones.length} zona(s) creadas pero requiere ${category.zonesCount}. Crear las faltantes antes de auto-balancear.`,
        HttpStatus.BAD_REQUEST,
        {
          categoryId,
          existingZones: zones.length,
          requiredZones: category.zonesCount,
        },
      );
    }

    // Equipos del torneo con inscripción aprobada (en castellano según
    // RegistrationsService — `'aprobada'`).
    const approvedRegistrations = await this.prisma.registration.findMany({
      where: {
        tournamentId: category.tournamentId,
        categoryId,
        status: 'aprobada',
      },
      orderBy: { createdAt: 'asc' },
      select: { teamId: true },
    });

    // Equipos ya asignados a alguna zona de esta categoría.
    const existing = await this.prisma.teamZone.findMany({
      where: { zone: { categoryId } },
      select: { teamId: true, zoneId: true },
    });
    const alreadyAssigned = new Set(existing.map((tz) => tz.teamId));

    const teamsToAssign = approvedRegistrations
      .map((r) => r.teamId)
      .filter((id) => !alreadyAssigned.has(id));

    // Distribución round-robin determinística — orden alternado por equipo
    // (t1→zA, t2→zB, t3→zA, t4→zB, ...). El orden de inserción importa para
    // que el resultado sea predecible.
    const zoneIds = zones.map((z) => z.id);
    const newAssignments: Array<{ zoneId: string; teamId: string }> = [];
    teamsToAssign.forEach((teamId, idx) => {
      newAssignments.push({ zoneId: zoneIds[idx % zoneIds.length], teamId });
    });

    if (newAssignments.length > 0) {
      await this.prisma.teamZone.createMany({
        data: newAssignments.map((a) => ({
          zoneId: a.zoneId,
          teamId: a.teamId,
        })),
        skipDuplicates: true,
      });
    }

    // Resultado final por zona, incluyendo los previos.
    const finalByZone: Record<string, string[]> = {};
    for (const z of zones) finalByZone[z.id] = [];
    for (const tz of existing) {
      if (finalByZone[tz.zoneId]) finalByZone[tz.zoneId].push(tz.teamId);
    }
    for (const a of newAssignments) {
      finalByZone[a.zoneId].push(a.teamId);
    }

    this.logger.log(
      `Auto-balance categoría ${categoryId}: ${newAssignments.length} nuevos / ${
        approvedRegistrations.length
      } aprobadas / ${zones.length} zonas`,
    );

    return {
      categoryId,
      totalTeams: approvedRegistrations.length,
      totalZones: zones.length,
      assignmentsByZone: finalByZone,
      newAssignments,
    };
  }
}
