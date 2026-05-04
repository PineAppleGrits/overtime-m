import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FriendlyStatus } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ParseOptionalUUIDPipe,
  ParseUUIDPipe,
} from '../../../common/pipes/parse-uuid.pipe';
import { CancelFriendlyUseCase } from '../../application/use-cases/cancel-friendly.use-case';
import { GenerateFriendlyUseCase } from '../../application/use-cases/generate-friendly.use-case';
import { GetFriendlyUseCase } from '../../application/use-cases/get-friendly.use-case';
import { ListFriendliesUseCase } from '../../application/use-cases/list-friendlies.use-case';
import { MarkFriendlyPlayedUseCase } from '../../application/use-cases/mark-played.use-case';
import { ObserveForCategorizationUseCase } from '../../application/use-cases/observe-for-categorization.use-case';
import { RequestFriendlyUseCase } from '../../application/use-cases/request-friendly.use-case';
import {
  CancelFriendlyBodyDto,
  GenerateFriendlyBodyDto,
  RequestFriendlyBodyDto,
} from '../dto/friendly-request.dto';

interface AuthenticatedProfile {
  id: string;
  role: string;
}

function isAdmin(user: AuthenticatedProfile | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'master';
}

@ApiTags('friendlies')
@ApiBearerAuth('access-token')
@Controller('friendlies')
export class FriendliesController {
  constructor(
    private readonly requestFriendly: RequestFriendlyUseCase,
    private readonly generateFriendly: GenerateFriendlyUseCase,
    private readonly cancelFriendly: CancelFriendlyUseCase,
    private readonly markPlayedUseCase: MarkFriendlyPlayedUseCase,
    private readonly observeUseCase: ObserveForCategorizationUseCase,
    private readonly listUseCase: ListFriendliesUseCase,
    private readonly getUseCase: GetFriendlyUseCase,
  ) {}

  /**
   * RN-059 — Solicitar amistoso desde la web (delegado).
   */
  @Post('request')
  @ApiOperation({ summary: 'Solicitar amistoso (delegado, web form)' })
  async request(
    @Body() body: RequestFriendlyBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ) {
    return this.requestFriendly.execute({
      homeTeamId: body.homeTeamId,
      awayTeamId: body.awayTeamId,
      modality: body.modality,
      proposedDate: new Date(body.proposedDate),
      venueId: body.venueId,
      notes: body.notes,
      requestedByProfileId: user.id,
      bypassDelegateCheck: false,
    });
  }

  /**
   * RN-059 — Solicitud manual desde admin (canal WhatsApp / a futuro otros).
   */
  @Post()
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Solicitar amistoso (admin manual — canales fuera de la web)',
  })
  async createAdmin(
    @Body() body: RequestFriendlyBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ) {
    return this.requestFriendly.execute({
      homeTeamId: body.homeTeamId,
      awayTeamId: body.awayTeamId,
      modality: body.modality,
      proposedDate: new Date(body.proposedDate),
      venueId: body.venueId,
      notes: body.notes,
      requestedByProfileId: user.id,
      bypassDelegateCheck: true,
    });
  }

  /**
   * RN-022 + RN-023 — admin genera el amistoso, dispara cobro de seña +
   * ventana 24h.
   */
  @Patch(':id/generate')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Generar amistoso (cobra señas + ventana 24h)' })
  async generate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: GenerateFriendlyBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ) {
    return this.generateFriendly.execute({
      friendlyId: id,
      depositAmount: body.depositAmount,
      currency: body.currency,
      confirmationWindowHours: body.confirmationWindowHours,
      generatedByProfileId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar amistosos' })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'REQUESTED',
      'GENERATED',
      'PENDING_CONFIRMATION',
      'CONFIRMED',
      'EXPIRED',
      'CANCELLED',
      'PLAYED',
      'OBSERVED_FOR_CATEGORIZATION',
    ],
  })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async list(
    @CurrentUser() user: AuthenticatedProfile,
    @Query('teamId', ParseOptionalUUIDPipe) teamId?: string,
    @Query('status') status?: FriendlyStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listUseCase.execute({
      callerProfileId: user.id,
      isAdmin: isAdmin(user),
      teamId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un amistoso' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedProfile,
  ) {
    return this.getUseCase.execute({
      friendlyId: id,
      callerProfileId: user.id,
      isAdmin: isAdmin(user),
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar amistoso (admin o creator)' })
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CancelFriendlyBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ) {
    return this.cancelFriendly.execute({
      friendlyId: id,
      cancelledByProfileId: user.id,
      reason: body?.reason,
      isAdmin: isAdmin(user),
    });
  }

  @Patch(':id/mark-played')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Marcar amistoso como jugado (admin)' })
  async markPlayed(@Param('id', ParseUUIDPipe) id: string) {
    return this.markPlayedUseCase.execute({ friendlyId: id });
  }

  @Patch(':id/observe-for-categorization')
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Marcar amistoso para categorización (RN-039) — sólo PLAYED',
  })
  async observe(@Param('id', ParseUUIDPipe) id: string) {
    return this.observeUseCase.execute({ friendlyId: id });
  }
}
