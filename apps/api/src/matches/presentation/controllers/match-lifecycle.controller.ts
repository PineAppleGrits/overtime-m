import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { MatchLifecycleService } from '../../application/services/match-lifecycle.service';
import {
  CancelMatchByTeamDto,
  FinishMatchDto,
  MutualCancelDto,
  RescheduleMatchDto,
  ResolveSuspendedDto,
  RivalDecisionDto,
  SuspendMatchDto,
} from '../dto/lifecycle.dto';

/**
 * Endpoints de lifecycle (W3.1). Coexisten con `MatchesController`
 * (CRUD básico). No reemplazan los endpoints existentes.
 */
@ApiTags('matches')
@Controller('matches')
export class MatchLifecycleController {
  constructor(private readonly lifecycle: MatchLifecycleService) {}

  @Post(':id/start')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Iniciar partido — valida staff (RN-049) + deudas (RN-053) + transición.',
  })
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.lifecycle.start(id);
  }

  @Post(':id/finish')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Finalizar partido — valida marcador con sport rules y emite match.finished.',
  })
  finish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinishMatchDto,
  ) {
    return this.lifecycle.finish(id, dto.homeScore, dto.awayScore);
  }

  @Post(':id/cancel-by-team')
  @ApiOperation({
    summary:
      'Cancelación por un equipo (RN-032). Si la antelación supera el umbral, reprograma; si no, queda en pending_rival_decision.',
  })
  cancelByTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelMatchByTeamDto,
  ) {
    return this.lifecycle.cancelByTeam({
      matchId: id,
      cancellingTeamId: dto.cancellingTeamId,
      reason: dto.reason,
    });
  }

  @Patch(':id/rival-decision')
  @ApiOperation({
    summary:
      'Resolución del rival ante cancelación (RN-032): request_points o reschedule.',
  })
  rivalDecision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RivalDecisionDto,
  ) {
    return this.lifecycle.resolveRivalDecision({
      matchId: id,
      rivalTeamId: dto.rivalTeamId,
      decision: dto.decision,
      newDate: dto.newDate ? new Date(dto.newDate) : undefined,
    });
  }

  @Post(':id/reschedule')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprogramación administrativa (RN-052).' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleMatchDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.lifecycle.reschedule({
      matchId: id,
      newDate: new Date(dto.newDate),
      reason: dto.reason,
      forceWithoutThreshold: dto.forceWithoutThreshold,
      performedBy: userId,
    });
  }

  @Post(':id/suspend')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspensión durante el encuentro (RN-054, RN-055).' })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendMatchDto,
  ) {
    return this.lifecycle.suspend({
      matchId: id,
      reason: dto.reason,
      currentScore: dto.currentScore,
      resolution: dto.resolution,
      winningTeamId: dto.winningTeamId,
    });
  }

  @Post(':id/resolve-suspended')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Resolver partido en suspendido_pendiente (RN-055): reanudar o fin_sin_continuidad.',
  })
  resolveSuspended(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSuspendedDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lifecycle.resolveSuspended({
      matchId: id,
      resolution: dto.resolution,
      currentScore: dto.currentScore,
      winningTeamId: dto.winningTeamId,
      resolvedBy: userId,
    });
  }

  @Post(':id/mutual-cancel')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelación mutua (RN-056) — 0-0 administrativo, no suma.',
  })
  mutualCancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MutualCancelDto,
  ) {
    return this.lifecycle.mutualCancel({
      matchId: id,
      reason: dto.reason,
    });
  }
}
