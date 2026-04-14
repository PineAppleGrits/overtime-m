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
import { ChangeStatusDto, PaginationDto } from '@overtime-mono/shared';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import {
  CreateTournamentBodyDto,
  UpdateTournamentBodyDto,
} from './dto/tournament-request.dto';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @Admin()
  create(@Body() createTournamentDto: CreateTournamentBodyDto) {
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
  @Admin()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTournamentDto: UpdateTournamentBodyDto,
  ) {
    return this.tournamentsService.update(id, updateTournamentDto);
  }

  @Patch(':id/status')
  @Admin()
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    return this.tournamentsService.changeStatus(id, changeStatusDto);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tournamentsService.remove(id);
  }
}
