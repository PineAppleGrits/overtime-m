import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchPlayerStatsService } from '../matches/match-player-stats.service';
import { Admin } from '../common/decorators/admin.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateFranchiseBodyDto } from '../franchises/dto/franchise-request.dto';
import {
  AddPlayerBodyDto,
  CreateTeamBodyDto,
  UpdateTeamBodyDto,
} from './dto/team-request.dto';
import {
  BASKETBALL_MODALITIES,
  Modality,
} from '../common/sport-rules/sport-rules.types';
import { TeamsFacadeService } from './application/services/teams-facade.service';

interface UploadedFileShape {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsFacadeService,
    private readonly matchPlayerStatsService: MatchPlayerStatsService,
  ) {}

  @Post()
  create(
    @Body() createTeamDto: CreateTeamBodyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.create(createTeamDto, userId);
  }

  @Post(':id/promote')
  promoteToFranchise(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createFranchiseDto: CreateFranchiseBodyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.promoteToFranchise(id, createFranchiseDto, userId);
  }

  @Get('mine')
  findMine(@CurrentUser('id') profileId: string) {
    return this.teamsService.findMine(profileId);
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.teamsService.findAll(paginationDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @Admin()
  @ApiOperation({
    summary:
      'Actualiza datos del equipo. RN-005 — el delegado NO puede editar; solo admin/master.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamBodyDto,
  ) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @Admin()
  @ApiOperation({ summary: 'Soft-delete del equipo. Solo admin/master.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.remove(id);
  }

  @Public()
  @Get(':id/matches')
  @ApiOperation({
    summary:
      'Último partido finalizado y/o próximo programado del team. Soporta ?type=last|next; sin type devuelve ambos. Pensado para previews públicos en perfil de equipo.',
  })
  findTeamMatches(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type?: string,
  ) {
    if (type && type !== 'last' && type !== 'next') {
      throw new BadRequestException(
        'Query param "type" debe ser uno de: last, next',
      );
    }
    return this.teamsService.findTeamMatches(id, type as 'last' | 'next' | undefined);
  }

  @Get(':id/balance')
  @ApiOperation({
    summary:
      'Estado financiero (deudas, pagos, comprobantes) y suspensiones del equipo. Auth: solo admin/master, creator o captain del team (BE-MOCK-004).',
  })
  getBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role?: string | null } | undefined,
  ) {
    return this.teamsService.getBalance(id, user?.id ?? '', user?.role);
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({
    summary:
      'Stats agregadas del team: PJ, PG, PP, PF, PC. Calculadas desde Match.homeScore/awayScore en partidos finalizados (BE-MOCK-005).',
  })
  getTeamStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchPlayerStatsService.aggregateTeamTotals(id);
  }

  @Public()
  @Get(':id/player-stats')
  @ApiOperation({
    summary:
      'Stats agregadas por jugador del team — suma de todos los MatchPlayerStat con teamId=X (BE-MOCK-005).',
  })
  getPlayerStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchPlayerStatsService.aggregatePlayerTotalsByTeam(id);
  }

  @Get(':id/roster-status')
  @ApiOperation({
    summary:
      'Estado de la lista de buena fe del equipo según las reglas del deporte+modalidad (RN-009).',
  })
  getRosterStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('modality') modality?: string,
  ) {
    if (!modality || !BASKETBALL_MODALITIES.includes(modality as Modality)) {
      throw new BadRequestException(
        `Query param "modality" debe ser uno de: ${BASKETBALL_MODALITIES.join(', ')}`,
      );
    }
    return this.teamsService.getRosterStatus(id, modality as Modality);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Sube el logo del equipo (multipart/form-data, campo "file"). Crea un MediaAsset y actualiza Team.logoAssetId.',
  })
  uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedFileShape,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo "file" requerido');
    }
    return this.teamsService.uploadLogo(id, userId, file);
  }

  @Post(':id/players')
  addPlayer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addPlayerDto: AddPlayerBodyDto,
  ) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.addPlayer(id, addPlayerDto);
  }

  @Delete(':id/players/:profileId')
  removePlayer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.removePlayer(id, profileId);
  }

  @Patch(':id/captain/:profileId')
  assignCaptain(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.assignCaptain(id, profileId);
  }
}
