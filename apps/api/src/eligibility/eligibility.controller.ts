import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  BlacklistQueryDto,
  CreateBlacklistEntryDto,
  CreateSanctionDto,
  EligibilityQueryDto,
  LiftBlacklistEntryDto,
  ResolveSanctionDto,
  SanctionQueryDto,
} from '@overtime-mono/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { EligibilityService } from './eligibility.service';

@ApiTags('eligibility')
@ApiBearerAuth('access-token')
@Controller('eligibility')
export class EligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @Post('blacklists')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Crear entrada de blacklist' })
  createBlacklist(
    @Body() dto: CreateBlacklistEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eligibilityService.createBlacklistEntry(dto, userId);
  }

  @Get('blacklists')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Listar blacklists' })
  findAllBlacklists(@Query() query: BlacklistQueryDto) {
    return this.eligibilityService.findAllBlacklists(query);
  }

  @Get('blacklists/:id')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Obtener blacklist por id' })
  findBlacklistById(@Param('id', ParseUUIDPipe) id: string) {
    return this.eligibilityService.findBlacklistById(id);
  }

  @Patch('blacklists/:id/lift')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Levantar blacklist' })
  liftBlacklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LiftBlacklistEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eligibilityService.liftBlacklistEntry(id, dto, userId);
  }

  @Post('sanctions')
  @Roles('admin', 'master', 'referee')
  @ApiOperation({ summary: 'Crear sanción' })
  createSanction(
    @Body() dto: CreateSanctionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eligibilityService.createSanction(dto, userId);
  }

  @Get('sanctions')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Listar sanciones' })
  findAllSanctions(@Query() query: SanctionQueryDto) {
    return this.eligibilityService.findAllSanctions(query);
  }

  @Get('sanctions/:id')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Obtener sanción por id' })
  findSanctionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.eligibilityService.findSanctionById(id);
  }

  @Patch('sanctions/:id/resolve')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Resolver sanción' })
  resolveSanction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSanctionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eligibilityService.resolveSanction(id, dto, userId);
  }

  @Get('profiles/:profileId')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Obtener elegibilidad de un perfil' })
  getProfileEligibility(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: EligibilityQueryDto,
  ) {
    return this.eligibilityService.getProfileEligibility(profileId, query);
  }

  @Get('teams/:teamId')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Obtener elegibilidad de un equipo' })
  getTeamEligibility(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query() query: EligibilityQueryDto,
  ) {
    return this.eligibilityService.getTeamEligibility(teamId, query);
  }
}
