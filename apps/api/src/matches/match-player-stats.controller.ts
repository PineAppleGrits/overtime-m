import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { MatchPlayerStatsService } from './match-player-stats.service';
import {
  upsertMatchPlayerStatsSchema,
  type UpsertMatchPlayerStatsBody,
} from './match-player-stats.zod';

/**
 * BE-MOCK-005 — endpoints de stats individuales por partido.
 *
 * - `GET /matches/:matchId/player-stats` (público) — lista actual.
 * - `POST /matches/:matchId/player-stats` (admin / master / official) — bulk
 *   upsert. Cada entrada es por jugador del partido. La carga es manual
 *   (DP cerrada) — la pantalla del admin (Detalle de partido) la dispara.
 */
@ApiTags('matches')
@Controller('matches')
export class MatchPlayerStatsController {
  constructor(
    private readonly matchPlayerStatsService: MatchPlayerStatsService,
  ) {}

  @Public()
  @Get(':matchId/player-stats')
  @ApiOperation({
    summary: 'Stats individuales del partido (un row por jugador con stats cargados).',
  })
  list(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.matchPlayerStatsService.listByMatch(matchId);
  }

  @Roles('admin', 'master', 'official')
  @Post(':matchId/player-stats')
  @ApiOperation({
    summary:
      'Bulk upsert de stats por jugador del partido. Solo admin/master/oficial de mesa. ' +
      'Cada entrada es atómica (idempotente por matchId+profileId).',
  })
  upsert(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @ZodBody(upsertMatchPlayerStatsSchema) body: UpsertMatchPlayerStatsBody,
    @CurrentUser('id') userId: string,
  ) {
    return this.matchPlayerStatsService.upsertForMatch(
      matchId,
      body.stats,
      userId,
    );
  }
}
