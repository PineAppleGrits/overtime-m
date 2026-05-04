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
import { CategoriesService } from './categories/categories.service';
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
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly categoriesService: CategoriesService,
  ) {}

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
    @Query('publishedOnly') publishedOnly?: string,
  ) {
    const onlyPublished =
      publishedOnly === 'true' || publishedOnly === '1';
    return this.tournamentsService.findAll(
      paginationDto,
      status,
      onlyPublished,
    );
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get tournament by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.tournamentsService.findBySlug(slug);
  }

  @Public()
  @Get('by-slug/:tournamentSlug/categories/:categorySlug')
  @ApiOperation({ summary: 'Get category by tournament slug and category slug' })
  findCategoryBySlug(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('categorySlug') categorySlug: string,
  ) {
    return this.categoriesService.findByTournamentSlugAndCategorySlug(
      tournamentSlug,
      categorySlug,
    );
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
