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
import { ZonesService } from './zones.service';
import { CreateZoneDto, UpdateZoneDto, AssignTeamDto, PaginationDto } from '@overtime-mono/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@Controller('categories/:categoryId/zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @Roles('admin')
  create(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() createZoneDto: CreateZoneDto,
  ) {
    return this.zonesService.create({
      ...createZoneDto,
      categoryId,
    });
  }

  @Public()
  @Get()
  findAll(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.zonesService.findAll(categoryId, paginationDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateZoneDto: UpdateZoneDto,
  ) {
    return this.zonesService.update(id, updateZoneDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.remove(id);
  }

  @Post(':id/teams')
  @Roles('admin')
  assignTeam(
    @Param('id', ParseUUIDPipe) zoneId: string,
    @Body() assignTeamDto: AssignTeamDto,
  ) {
    return this.zonesService.assignTeam(zoneId, assignTeamDto);
  }

  @Delete(':id/teams/:teamId')
  @Roles('admin')
  removeTeam(
    @Param('id', ParseUUIDPipe) zoneId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ) {
    return this.zonesService.removeTeam(zoneId, teamId);
  }
}
