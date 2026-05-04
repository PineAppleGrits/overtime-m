import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { IDebtContext } from '../../application/ports/debt-context.port';

/**
 * Implementación de `IDebtContext` con Prisma.
 *
 * `findTeamIdsForProfile` consulta `ProfileTeam` (tabla `player_teams`)
 * con `isActive=true`.
 *
 * `resolveOverdueDailyAmountForDebt` por ahora siempre retorna `null` —
 * deja la fee referencial $5.000 vigente. Cuando se cierre RN-021 / DP-tarifas,
 * leer del torneo asociado a la deuda.
 */
@Injectable()
export class DebtContextService implements IDebtContext {
  constructor(private readonly prisma: PrismaService) {}

  async findTeamIdsForProfile(profileId: string): Promise<string[]> {
    const memberships = await this.prisma.profileTeam.findMany({
      where: { profileId, isActive: true },
      select: { teamId: true },
    });
    return memberships.map((m) => m.teamId);
  }

  async resolveOverdueDailyAmountForDebt(
    _debtId: string,
  ): Promise<number | null> {
    // TODO: RN-021 / DP — fee global configurable.
    // Cuando esté disponible, leer:
    //   1) Tournament.metadata.overdueInterestDailyAmount si la deuda viene de
    //      registrationId/matchId/friendlyId que apunta a un torneo.
    //   2) Si no, fallback a un setting global (ej. tabla `system_settings`).
    // Por ahora retorna null → caller usa DEFAULT_OVERDUE_DAILY_AMOUNT.
    return null;
  }
}
