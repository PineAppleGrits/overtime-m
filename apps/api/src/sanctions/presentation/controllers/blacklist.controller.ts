import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BlacklistEntry } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { SanctionsService } from '../../application/services/sanctions.service';
import {
  CreateBlacklistEntryBodyDto,
  LiftBlacklistEntryBodyDto,
} from '../dto/blacklist.body';

interface AuthenticatedProfile {
  id: string;
  role: string;
}

@ApiTags('blacklist')
@ApiBearerAuth('access-token')
@Controller('blacklist')
export class BlacklistController {
  constructor(private readonly sanctionsService: SanctionsService) {}

  @Post()
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Crear blacklist (admin)' })
  async create(
    @Body() body: CreateBlacklistEntryBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<BlacklistEntry> {
    return this.sanctionsService.createBlacklistEntry({
      profileId: body.profileId,
      documentNumber: body.documentNumber,
      profileNameSnapshot: body.profileNameSnapshot,
      reason: body.reason,
      attachmentUrls: body.attachmentUrls,
      blockedByProfileId: user.id,
    });
  }

  @Get()
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Listar blacklist (admin)' })
  async list(
    @Query('status') status?: 'ACTIVE' | 'LIFTED',
    @Query('profileId') profileId?: string,
    @Query('documentNumber') documentNumber?: string,
    @Query('createdBy') createdBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: BlacklistEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.sanctionsService.listBlacklist({
      status,
      profileId,
      documentNumber,
      createdBy,
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
  }

  @Post(':id/lift')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Liftear blacklist (admin)' })
  async lift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: LiftBlacklistEntryBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<BlacklistEntry> {
    return this.sanctionsService.liftBlacklistEntry({
      blacklistId: id,
      liftedByProfileId: user.id,
      resolutionNotes: body.resolutionNotes,
    });
  }

  /**
   * Endpoint público (de uso interno o pre-registro): consulta si un DNI
   * está bloqueado.
   */
  @Get('check/:documentNumber')
  @Public()
  @ApiOperation({ summary: 'Consultar si un DNI está bloqueado (público)' })
  async check(
    @Param('documentNumber') documentNumber: string,
  ): Promise<{ blocked: boolean; entries: BlacklistEntry[] }> {
    return this.sanctionsService.checkBlacklistByDocument(documentNumber);
  }
}
