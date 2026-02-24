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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto, UpdateTournamentDto, ChangeStatusDto, PaginationDto } from '@overtime-mono/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentsService.create(createTournamentDto);
  }

  @Public()
  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.tournamentsService.findAll(paginationDto, status);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get tournament by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.tournamentsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.update(id, updateTournamentDto);
  }

  @Patch(':id/status')
  @Roles('admin')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    return this.tournamentsService.changeStatus(id, changeStatusDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tournamentsService.remove(id);
  }
}
