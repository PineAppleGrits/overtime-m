import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaCategory } from '@prisma/client';
import {
  BlacklistQueryDto,
  CreateBlacklistEntryDto,
  CreateSanctionDto,
  EligibilityQueryDto,
  LiftBlacklistEntryDto,
  ResolveSanctionDto,
  SanctionQueryDto,
} from '@overtime-mono/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { EligibilityService } from '../../application/services/eligibility.service';
import { UploadMedicalCertUseCase } from '../../application/use-cases/upload-medical-cert.use-case';

interface UploadedFileShape {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
import { UploadSwornStatementUseCase } from '../../application/use-cases/upload-sworn-statement.use-case';
import { GetMedicalHistoryUseCase } from '../../application/use-cases/get-medical-history.use-case';
import { SanctionsService } from '../../../sanctions/application/services/sanctions.service';
import { toSanctionResponse } from '../../../sanctions/presentation/mappers/sanction.mapper';

interface AuthenticatedProfile {
  id: string;
  role: string;
}

@ApiTags('eligibility')
@ApiBearerAuth('access-token')
@Controller('eligibility')
export class EligibilityController {
  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly sanctionsService: SanctionsService,
    private readonly uploadMedical: UploadMedicalCertUseCase,
    private readonly uploadSworn: UploadSwornStatementUseCase,
    private readonly getMedicalHistory: GetMedicalHistoryUseCase,
  ) {}

  // ── Checks consolidados (W3.3) ─────────────────────────────────────────

  @Get('players/:profileId/match/:matchId')
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Elegibilidad de un jugador para un partido (consolidado)',
  })
  async checkPlayerForMatch(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Query('teamId') teamId?: string,
  ): Promise<{ eligible: boolean; reasons: string[] }> {
    const result = await this.eligibilityService.getPlayerMatchEligibility({
      profileId,
      matchId,
      teamId,
    });
    return result.toSimpleResponse();
  }

  @Get('players/:profileId/tournament/:tournamentId')
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Elegibilidad de un jugador para un torneo (consolidado)',
  })
  async checkPlayerForTournament(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Query('proposedTeamId') proposedTeamId?: string,
    @Query('proposedCategoryId') proposedCategoryId?: string,
  ): Promise<{ eligible: boolean; reasons: string[] }> {
    const result =
      await this.eligibilityService.getPlayerTournamentEligibility({
        profileId,
        tournamentId,
        proposedTeamId,
        proposedCategoryId,
      });
    return result.toSimpleResponse();
  }

  @Get('teams/:teamId/match/:matchId')
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Elegibilidad de un equipo para un partido (consolidado)',
  })
  async checkTeamForMatch(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ): Promise<{ eligible: boolean; reasons: string[] }> {
    const result = await this.eligibilityService.getTeamMatchEligibility({
      teamId,
      matchId,
    });
    return result.toSimpleResponse();
  }

  // ── Endpoints legacy (compat con FE actual) ────────────────────────────

  @Get('profiles/:profileId')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Elegibilidad de un perfil (compat)' })
  async getProfileEligibility(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: EligibilityQueryDto,
  ) {
    return this.eligibilityService.getProfileEligibility(profileId, query);
  }

  @Get('teams/:teamId')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Elegibilidad de un equipo (compat)' })
  async getTeamEligibility(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query() query: EligibilityQueryDto,
  ) {
    return this.eligibilityService.getTeamEligibility(teamId, query);
  }

  // ── Backwards-compat: sanctions y blacklists bajo /eligibility/* ───────
  // Se mantienen los endpoints anteriores para no romper el FE existente.
  // Los nuevos endpoints viven en /sanctions/* y /blacklist/*.

  @Post('blacklists')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Crear blacklist (compat — ver /blacklist)' })
  async createBlacklist(
    @Body() dto: CreateBlacklistEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sanctionsService.createBlacklistEntry({
      profileId: dto.profileId,
      documentNumber: dto.documentNumber,
      profileNameSnapshot: dto.profileNameSnapshot,
      reason: dto.reason,
      attachmentUrls: dto.attachmentUrls,
      blockedByProfileId: userId,
    });
  }

  @Get('blacklists')
  @Roles('admin', 'master')
  async findAllBlacklists(@Query() query: BlacklistQueryDto) {
    return this.sanctionsService.listBlacklist({
      status: query.status,
      profileId: query.profileId,
      documentNumber: query.documentNumber,
      createdBy: query.createdBy,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Patch('blacklists/:id/lift')
  @Roles('admin', 'master')
  async liftBlacklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LiftBlacklistEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sanctionsService.liftBlacklistEntry({
      blacklistId: id,
      liftedByProfileId: userId,
      resolutionNotes: dto.resolutionNotes,
    });
  }

  @Post('sanctions')
  @Roles('admin', 'master', 'referee')
  async createSanction(
    @Body() dto: CreateSanctionDto,
    @CurrentUser('id') userId: string,
  ) {
    const sanction = await this.sanctionsService.createSanction({
      targetType: dto.targetType,
      targetProfileId: dto.targetProfileId,
      targetTeamId: dto.targetTeamId,
      kind: dto.kind,
      reason: dto.reason,
      notes: dto.notes,
      attachmentUrls: dto.attachmentUrls,
      matchId: dto.matchId,
      tournamentId: dto.tournamentId,
      categoryId: dto.categoryId,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      amount: dto.amount,
      currency: dto.currency,
      createdByProfileId: userId,
    });
    return toSanctionResponse(sanction);
  }

  @Get('sanctions')
  @Roles('admin', 'master')
  async findAllSanctions(@Query() query: SanctionQueryDto) {
    const result = await this.sanctionsService.listSanctions({
      status: query.status,
      kind: query.kind,
      targetType: query.targetType,
      targetProfileId: query.targetProfileId,
      targetTeamId: query.targetTeamId,
      matchId: query.matchId,
      tournamentId: query.tournamentId,
      categoryId: query.categoryId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      data: result.data.map((s) => toSanctionResponse(s)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('sanctions/:id')
  @Roles('admin', 'master')
  async findSanctionById(@Param('id', ParseUUIDPipe) id: string) {
    const sanction = await this.sanctionsService.getSanction(id);
    return toSanctionResponse(sanction);
  }

  @Patch('sanctions/:id/resolve')
  @Roles('admin', 'master')
  async resolveSanction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSanctionDto,
    @CurrentUser('id') userId: string,
  ) {
    const sanction = await this.sanctionsService.resolveSanction({
      sanctionId: id,
      resolvedByProfileId: userId,
      resolutionNotes: dto.resolutionNotes,
    });
    return toSanctionResponse(sanction);
  }

  // ── Apto médico / DDJJ (RN-008 versionado) ─────────────────────────────

  @Post('profiles/me/medical-cert')
  @Roles('admin', 'master', 'player', 'referee', 'photographer')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir apto médico propio (RN-008)' })
  async uploadMyMedicalCert(
    @UploadedFile() file: UploadedFileShape,
    @CurrentUser() user: AuthenticatedProfile,
    @Query('year') year?: string,
  ) {
    if (!file) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Archivo requerido (campo "file")',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.uploadMedical.execute({
      profileId: user.id,
      uploadedByProfileId: user.id,
      contentType: file.mimetype,
      originalFilename: file.originalname,
      body: file.buffer,
      year: year ? Number.parseInt(year, 10) : undefined,
    });
  }

  @Post('profiles/me/sworn-statement')
  @Roles('admin', 'master', 'player', 'referee', 'photographer')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir DDJJ propia (RN-008)' })
  async uploadMySworn(
    @UploadedFile() file: UploadedFileShape,
    @CurrentUser() user: AuthenticatedProfile,
    @Query('year') year?: string,
  ) {
    if (!file) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Archivo requerido (campo "file")',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.uploadSworn.execute({
      profileId: user.id,
      uploadedByProfileId: user.id,
      contentType: file.mimetype,
      originalFilename: file.originalname,
      body: file.buffer,
      year: year ? Number.parseInt(year, 10) : undefined,
    });
  }

  @Get('profiles/:profileId/medical-history')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Histórico de apto médico / DDJJ' })
  async medicalHistory(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query('category') category?: 'MEDICAL_CERT' | 'SWORN_STATEMENT',
  ) {
    return this.getMedicalHistory.execute({
      profileId,
      category: category as MediaCategory | undefined,
    });
  }
}
