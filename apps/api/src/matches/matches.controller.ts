import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import {
  CreateMatchDto,
  UpdateMatchDto,
  ChangeMatchStatusDto,
  CreateAnnouncementDto,
  PaginationDto,
  BatchCreateMatchesDto,
  BatchChangeStatusDto,
} from '@overtime-mono/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUUIDPipe, ParseOptionalUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @Roles('admin')
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Post('batch')
  @Roles('admin')
  @ApiOperation({ summary: 'Crear múltiples partidos en batch' })
  createBatch(@Body() batchDto: BatchCreateMatchesDto) {
    return this.matchesService.createBatch(batchDto);
  }

  @Patch('batch/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Cambiar estado de múltiples partidos' })
  batchChangeStatus(@Body() batchDto: BatchChangeStatusDto) {
    return this.matchesService.batchChangeStatus(batchDto);
  }

  @Public()
  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
    @Query('categoryId', ParseOptionalUUIDPipe) categoryId?: string,
    @Query('zoneId', ParseOptionalUUIDPipe) zoneId?: string,
    @Query('venueId', ParseOptionalUUIDPipe) venueId?: string,
    @Query('matchType') matchType?: string,
  ) {
    return this.matchesService.findAll(paginationDto, {
      status,
      categoryId,
      zoneId,
      venueId,
      matchType,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Patch(':id/status')
  @Roles('admin')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeMatchStatusDto,
  ) {
    return this.matchesService.changeStatus(id, changeStatusDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchesService.remove(id);
  }

  @Post(':id/announcements')
  @Roles('admin')
  createAnnouncement(
    @Param('id', ParseUUIDPipe) matchId: string,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.matchesService.createAnnouncement(
      matchId,
      createAnnouncementDto,
      userId,
    );
  }

  @Public()
  @Get(':id/announcements')
  getAnnouncements(@Param('id', ParseUUIDPipe) matchId: string) {
    return this.matchesService.getAnnouncements(matchId);
  }
}
