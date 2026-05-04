import {
  Body,
  Controller,
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
import { DebtStatus, DebtType } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ParseOptionalUUIDPipe,
  ParseUUIDPipe,
} from '../../../common/pipes/parse-uuid.pipe';
import { CreateDebtUseCase } from '../../application/use-cases/create-debt.use-case';
import { ChangeDebtStatusUseCase } from '../../application/use-cases/change-debt-status.use-case';
import { ListDebtsUseCase } from '../../application/use-cases/list-debts.use-case';
import { GetDebtUseCase } from '../../application/use-cases/get-debt.use-case';
import {
  ChangeDebtStatusBodyDto,
  CreateDebtBodyDto,
} from '../dto/debt-request.dto';
import {
  DebtResponseDto,
  toDebtResponseDto,
} from '../mappers/debt.mapper';

interface AuthenticatedProfile {
  id: string;
  role: string;
}

function isAdmin(user: AuthenticatedProfile | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'master';
}

@ApiTags('debts')
@ApiBearerAuth('access-token')
@Controller('debts')
export class DebtsController {
  constructor(
    private readonly createDebt: CreateDebtUseCase,
    private readonly changeStatus: ChangeDebtStatusUseCase,
    private readonly listDebts: ListDebtsUseCase,
    private readonly getDebt: GetDebtUseCase,
  ) {}

  /**
   * RN-031 — Crear deuda manual (admin).
   */
  @Post()
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Crear deuda manual (admin)' })
  async create(
    @Body() body: CreateDebtBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<DebtResponseDto> {
    const debt = await this.createDebt.execute({
      type: body.type as DebtType,
      concept: body.concept,
      originAmount: body.originAmount,
      dueDate: new Date(body.dueDate),
      currency: body.currency,
      teamId: body.teamId,
      profileId: body.profileId,
      registrationId: body.registrationId,
      matchId: body.matchId,
      friendlyId: body.friendlyId,
      sanctionId: body.sanctionId,
      notes: body.notes,
      metadata: body.metadata,
      createdByProfileId: user.id,
    });
    return toDebtResponseDto(debt, { includeRelations: true });
  }

  @Get()
  @ApiOperation({ summary: 'Listar deudas' })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'profileId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'APPROVED',
      'PARTIALLY_PAID',
      'PAID',
      'DELETED_BY_ERROR',
      'DELETED_WITH_RECORD',
      'CANCELLED',
    ],
  })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'overdueOnly', required: false, type: Boolean })
  async list(
    @CurrentUser() user: AuthenticatedProfile,
    @Query('teamId', ParseOptionalUUIDPipe) teamId?: string,
    @Query('profileId', ParseOptionalUUIDPipe) profileId?: string,
    @Query('status') status?: DebtStatus,
    @Query('type') type?: DebtType,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('overdueOnly') overdueOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: DebtResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.listDebts.execute({
      callerProfileId: user.id,
      isAdmin: isAdmin(user),
      teamId,
      profileId,
      status,
      type,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      overdueOnly: overdueOnly === 'true',
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
    return {
      data: result.data.map((d) => toDebtResponseDto(d)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una deuda (con pagos, hijas y audits)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<DebtResponseDto> {
    const debt = await this.getDebt.execute({
      debtId: id,
      callerProfileId: user.id,
      isAdmin: isAdmin(user),
    });
    return toDebtResponseDto(debt, { includeRelations: true });
  }

  @Patch(':id/status')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Cambiar estado de la deuda (admin) — RN-031' })
  async changeDebtStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeDebtStatusBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<DebtResponseDto> {
    const updated = await this.changeStatus.execute({
      debtId: id,
      toStatus: body.toStatus as DebtStatus,
      reason: body.reason,
      byProfileId: user.id,
    });
    return toDebtResponseDto(updated, { includeRelations: true });
  }
}
