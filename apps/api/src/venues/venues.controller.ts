import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CheckAvailabilityDto,
  CreateVenueDto,
  PaginationDto,
  UpdateVenueDto,
} from '@overtime-mono/shared';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { VenuesService } from './application/services/venues.service';

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @Roles('admin')
  create(@Body() createVenueDto: CreateVenueDto) {
    return this.venuesService.create(createVenueDto);
  }

  @Public()
  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.venuesService.findAll(paginationDto, isActiveBool);
  }

  @Public()
  @Get('available')
  findAvailableVenues(
    @Query() checkAvailabilityDto: CheckAvailabilityDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.venuesService.findAvailableVenues(
      checkAvailabilityDto,
      paginationDto,
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.findOne(id);
  }

  @Get(':id/availability')
  @Public()
  checkAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() checkAvailabilityDto: CheckAvailabilityDto,
  ) {
    return this.venuesService.checkAvailability(id, checkAvailabilityDto);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    return this.venuesService.update(id, updateVenueDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.venuesService.remove(id);
  }
}
