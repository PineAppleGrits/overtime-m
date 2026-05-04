import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamCategorizationDto } from '@overtime-mono/shared';
import { Admin } from '../../../common/decorators/admin.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { AssignTeamCategorizationUseCase } from '../../application/use-cases/assign-team-categorization.use-case';
import { GetTeamCategorizationUseCase } from '../../application/use-cases/get-team-categorization.use-case';
import {
  ListPendingCategorizationUseCase,
  PendingCategorizationItem,
} from '../../application/use-cases/list-pending-categorization.use-case';
import { RemoveTeamLevelUseCase } from '../../application/use-cases/remove-team-level.use-case';
import { CategorizeTeamBodyDto } from '../dto/team-categorization-request.dto';

@ApiTags('team-categorization')
@Controller('teams')
export class TeamCategorizationController {
  constructor(
    private readonly assignUseCase: AssignTeamCategorizationUseCase,
    private readonly getUseCase: GetTeamCategorizationUseCase,
    private readonly removeUseCase: RemoveTeamLevelUseCase,
    private readonly listPendingUseCase: ListPendingCategorizationUseCase,
  ) {}

  @Get('categorization/pending')
  @Admin()
  @ApiOperation({
    summary:
      'Lista equipos pendientes de categorizar (con N+ amistosos observados). Solo admin/master.',
  })
  async listPending(): Promise<PendingCategorizationItem[]> {
    return this.listPendingUseCase.execute();
  }

  @Get(':teamId/categorization')
  @ApiOperation({ summary: 'Devuelve la categorización actual del equipo.' })
  async getCategorization(
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ): Promise<TeamCategorizationDto> {
    return this.getUseCase.execute(teamId);
  }

  @Post(':teamId/categorize')
  @Admin()
  @ApiOperation({
    summary:
      'Asigna niveles al equipo (agrega sin reemplazar, máximo 2 — RN-044). Solo admin/master.',
  })
  async assign(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() body: CategorizeTeamBodyDto,
    @CurrentUser('id') userId: string,
  ): Promise<TeamCategorizationDto> {
    await this.assignUseCase.execute({
      teamId,
      levelCodes: body.levelCodes,
      notes: body.notes,
      grantedByProfileId: userId,
      replace: false,
    });
    return this.getUseCase.execute(teamId);
  }

  @Patch(':teamId/categorize')
  @Admin()
  @ApiOperation({
    summary:
      'Reemplaza el set completo de niveles del equipo (máximo 2 — RN-044). Solo admin/master.',
  })
  async replace(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() body: CategorizeTeamBodyDto,
    @CurrentUser('id') userId: string,
  ): Promise<TeamCategorizationDto> {
    await this.assignUseCase.execute({
      teamId,
      levelCodes: body.levelCodes,
      notes: body.notes,
      grantedByProfileId: userId,
      replace: true,
    });
    return this.getUseCase.execute(teamId);
  }

  @Delete(':teamId/categorize/:teamCategoryLevelId')
  @Admin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Quita una asignación de nivel del equipo. Solo admin/master.',
  })
  async remove(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('teamCategoryLevelId', ParseUUIDPipe)
    teamCategoryLevelId: string,
  ): Promise<void> {
    await this.removeUseCase.execute(teamId, teamCategoryLevelId);
  }
}
