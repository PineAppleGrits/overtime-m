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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AssignStaffToMatchDto,
  BatchAssignStaffDto,
  CreateStaffDto,
  PaginationDto,
  SetAvailabilityDto,
  StaffType,
  UpdateStaffDto,
} from '@overtime-mono/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { StaffService } from '../../application/services/staff.service';
import { StaffTypeValue } from '../../domain/entities/staff.entity';
import { ApplyAjcDto, ComputeAjcDto } from '../dto/ajc.dto';
import { CreatePhotoFolderDto } from '../dto/photo-folder.dto';
import {
  toMatchStaffResponse,
  toStaffResponse,
} from '../mappers/staff.mapper';

interface AuthenticatedUser {
  id: string;
  role?: string;
}

@ApiTags('staff')
@ApiBearerAuth('access-token')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ==========
  // CRUD
  // ==========

  @Post()
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Crear nuevo personal' })
  async create(@Body() dto: CreateStaffDto) {
    const created = await this.staffService.create({
      type: dto.type as unknown as StaffTypeValue,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      profileId: dto.profileId,
    });
    return toStaffResponse(created);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar personal' })
  @ApiQuery({ name: 'type', required: false, enum: StaffType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('type') type?: StaffType,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;
    const result = await this.staffService.list({
      type: type as unknown as StaffTypeValue | undefined,
      isActive: isActiveBool,
      page: paginationDto.page,
      limit: paginationDto.limit,
      sortBy: paginationDto.sortBy as 'createdAt' | 'firstName' | 'lastName' | undefined,
      sortOrder: paginationDto.sortOrder,
    });
    return {
      data: result.data.map(toStaffResponse),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('available')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Obtener staff disponible para una fecha' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'type', required: false, enum: StaffType })
  @ApiQuery({
    name: 'excludeBusy',
    required: false,
    type: Boolean,
    description: 'Excluir staff con asignaciones en conflicto. Default true.',
  })
  async findAvailable(
    @Query('date') date: string,
    @Query('type') type?: StaffType,
    @Query('excludeBusy') excludeBusy?: string,
  ) {
    const excludeBusyBool = excludeBusy === 'false' ? false : true;
    const result = await this.staffService.findAvailable({
      date: new Date(date),
      type: type as unknown as StaffTypeValue | undefined,
      excludeBusy: excludeBusyBool,
    });
    return result.map(toStaffResponse);
  }

  // ==========
  // RN-030 — AJC (declarado ANTES de :id para evitar match con la ruta /staff/:id)
  // ==========

  @Post('ajc/compute')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'RN-030 — Calcular monto AJC (preview, no crea nada)' })
  computeAjc(@Body() dto: ComputeAjcDto) {
    return this.staffService.computeAjcFee({
      refereeSalary: dto.refereeSalary,
      fechasToFree: dto.fechasToFree,
    });
  }

  @Post('ajc/apply')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'RN-030 — Aplicar AJC: crea Debt y registra metadata en sanción' })
  applyAjc(
    @Body() dto: ApplyAjcDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.staffService.applyAjc({
      profileId: dto.profileId,
      sanctionId: dto.sanctionId,
      refereeSalary: dto.refereeSalary,
      fechasToFree: dto.fechasToFree,
      sanctionTotalFechas: dto.sanctionTotalFechas,
      appliedByProfileId: user.id,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener detalle de un personal' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const found = await this.staffService.findOne(id);
    return toStaffResponse(found);
  }

  @Patch(':id')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Actualizar personal' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    const updated = await this.staffService.update({
      id,
      type: dto.type as unknown as StaffTypeValue | undefined,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      isActive: dto.isActive,
    });
    return toStaffResponse(updated);
  }

  @Delete(':id')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Eliminar personal (soft-delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.staffService.delete(id);
    return { message: 'Staff eliminado correctamente' };
  }

  // ==========
  // Availability
  // ==========

  @Post(':id/availability')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Configurar disponibilidad horaria' })
  async setAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    const slots = await this.staffService.setAvailability({
      staffId: id,
      slots: dto.availability,
    });
    return slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Obtener partidos asignados' })
  @ApiQuery({ name: 'status', required: false })
  async getAssignedMatches(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: string,
  ) {
    const list = await this.staffService.getAssignedMatches({
      staffId: id,
      matchStatus: status,
    });
    return list.map(toMatchStaffResponse);
  }

  // ==========
  // Asignación a partidos (RN-050)
  // ==========

  @Post('matches/batch-assign')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'RN-050 — Asignar staff a múltiples partidos en batch' })
  async batchAssign(
    @Body() dto: BatchAssignStaffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.staffService.batchAssign({
      assignments: dto.assignments.map((a) => ({
        matchId: a.matchId,
        staffId: a.staffId,
        role: a.role as unknown as StaffTypeValue,
      })),
      assignedByProfileId: user.id,
    });
    return {
      assigned: result.assigned.map(toMatchStaffResponse),
      errors: result.errors,
    };
  }

  @Post('matches/:matchId/assign')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'RN-050 — Asignar staff a un partido' })
  async assignToMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: AssignStaffToMatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const created = await this.staffService.assignToMatch({
      matchId,
      staffId: dto.staffId,
      role: dto.role as unknown as StaffTypeValue,
      assignedByProfileId: user.id,
    });
    return toMatchStaffResponse(created);
  }

  @Delete('matches/:matchId/staff/:staffId')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Remover staff de un partido' })
  async removeFromMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ) {
    await this.staffService.removeFromMatch({ matchId, staffId });
    return { message: 'Staff removido del partido' };
  }

  // ==========
  // RN-051 — Drive folder
  // ==========

  @Post('matches/:matchId/photo-folder')
  @Roles('admin', 'master')
  @ApiOperation({
    summary:
      'RN-051 — Crear manualmente la carpeta Drive para fotos del partido (también se crea automáticamente al iniciar)',
  })
  async createPhotoFolder(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: CreatePhotoFolderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.staffService.createMatchPhotoFolder({
      matchId,
      parentFolderId: dto.parentFolderId,
      createdByProfileId: user.id,
    });
  }
}
