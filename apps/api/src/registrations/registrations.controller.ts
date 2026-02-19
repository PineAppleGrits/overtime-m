import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUUIDPipe, ParseOptionalUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('registrations')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  create(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.create(createRegistrationDto, userId);
  }

  @Public()
  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('tournamentId', ParseOptionalUUIDPipe) tournamentId?: string,
    @Query('teamId', ParseOptionalUUIDPipe) teamId?: string,
    @Query('categoryId', ParseOptionalUUIDPipe) categoryId?: string,
    @Query('status') status?: string,
  ) {
    return this.registrationsService.findAll(paginationDto, {
      tournamentId,
      teamId,
      categoryId,
      status,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles('admin')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.approve(id, userId);
  }

  @Patch(':id/reject')
  @Roles('admin')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveRegistrationDto: ApproveRegistrationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.reject(
      id,
      userId,
      approveRegistrationDto.rejectionReason,
    );
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.remove(id);
  }
}
