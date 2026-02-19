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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto, StaffType } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AssignStaffToMatchDto } from './dto/assign-staff-match.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe, ParseOptionalUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('staff')
@ApiBearerAuth('access-token')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear nuevo personal' })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar personal' })
  @ApiQuery({ name: 'type', required: false, enum: StaffType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('type') type?: StaffType,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.staffService.findAll(paginationDto, { type, isActive: isActiveBool });
  }

  @Get('available')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener staff disponible para una fecha' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'type', required: false, enum: StaffType })
  findAvailable(
    @Query('date') date: string,
    @Query('type') type?: StaffType,
  ) {
    return this.staffService.findAvailable(new Date(date), type);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener detalle de un personal' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar personal' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar personal' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.remove(id);
  }

  @Post(':id/availability')
  @Roles('admin')
  @ApiOperation({ summary: 'Configurar disponibilidad horaria' })
  setAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() setAvailabilityDto: SetAvailabilityDto,
  ) {
    return this.staffService.setAvailability(id, setAvailabilityDto);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Obtener partidos asignados' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado del partido' })
  getAssignedMatches(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: string,
  ) {
    return this.staffService.getAssignedMatches(id, status);
  }

  @Post('matches/:matchId/assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Asignar staff a un partido' })
  assignToMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() assignDto: AssignStaffToMatchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.staffService.assignToMatch(matchId, assignDto, userId);
  }

  @Delete('matches/:matchId/staff/:staffId')
  @Roles('admin')
  @ApiOperation({ summary: 'Remover staff de un partido' })
  removeFromMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ) {
    return this.staffService.removeFromMatch(matchId, staffId);
  }
}
