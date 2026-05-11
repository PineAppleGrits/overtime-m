import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ApproveRegistrationDto, PaginationDto } from '@overtime-mono/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  ParseUUIDPipe,
  ParseOptionalUUIDPipe,
} from '../common/pipes/parse-uuid.pipe';
import {
  AddRegistrationRosterEntryBodyDto,
  CreateRegistrationBodyDto,
} from './dto/registration-request.dto';
import { RegistrationsFacadeService } from './application/services/registrations-facade.service';

@ApiTags('registrations')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsFacadeService) {}

  @Post()
  create(
    @Body() createRegistrationDto: CreateRegistrationBodyDto,
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
    @Req() req?: Request & { user?: { role?: string } },
  ) {
    // RN-018 — publicación progresiva: usuarios no-admin sólo ven inscripciones
    // ya aprobadas. Admin y master pueden filtrar libremente o ver todo.
    const userRole = req?.user?.role;
    const isPrivileged = userRole === 'admin' || userRole === 'master';
    const effectiveStatus = isPrivileged ? status : 'aprobada';
    return this.registrationsService.findAll(paginationDto, {
      tournamentId,
      teamId,
      categoryId,
      status: effectiveStatus,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.findOne(id);
  }

  @Get(':id/roster')
  findRoster(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.findRoster(id);
  }

  @Post(':id/roster/additions')
  addRosterEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addRosterEntryDto: AddRegistrationRosterEntryBodyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.addRosterEntry(
      id,
      addRosterEntryDto,
      userId,
    );
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
