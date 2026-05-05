import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { SanctionsService } from '../../application/services/sanctions.service';
import { UploadSanctionAttachmentUseCase } from '../../application/use-cases/upload-sanction-attachment.use-case';
import {
  CancelSanctionBodyDto,
  CreateSanctionBodyDto,
  ResolveSanctionBodyDto,
} from '../dto/create-sanction.body';
import {
  toSanctionResponse,
  SanctionResponseDto,
} from '../mappers/sanction.mapper';

interface AuthenticatedProfile {
  id: string;
  role: string;
}

interface UploadedFileShape {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@ApiTags('sanctions')
@ApiBearerAuth('access-token')
@Controller('sanctions')
export class SanctionsController {
  constructor(
    private readonly sanctionsService: SanctionsService,
    private readonly uploadAttachment: UploadSanctionAttachmentUseCase,
  ) {}

  @Post()
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Crear sanción (admin)' })
  async create(
    @Body() body: CreateSanctionBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<SanctionResponseDto> {
    const sanction = await this.sanctionsService.createSanction({
      targetType: body.targetType,
      targetProfileId: body.targetProfileId,
      targetTeamId: body.targetTeamId,
      kind: body.kind,
      reason: body.reason,
      notes: body.notes,
      attachmentUrls: body.attachmentUrls,
      matchId: body.matchId,
      tournamentId: body.tournamentId,
      categoryId: body.categoryId,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      amount: body.amount,
      currency: body.currency,
      totalFechas: body.totalFechas,
      createdByProfileId: user.id,
    });
    return toSanctionResponse(sanction);
  }

  @Get()
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Listar sanciones' })
  async list(
    @Query('status') status?: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED',
    @Query('kind') kind?: 'DISCIPLINARY' | 'MONETARY',
    @Query('targetType') targetType?: 'PROFILE' | 'TEAM',
    @Query('targetProfileId') targetProfileId?: string,
    @Query('targetTeamId') targetTeamId?: string,
    @Query('matchId') matchId?: string,
    @Query('tournamentId') tournamentId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: SanctionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.sanctionsService.listSanctions({
      status,
      kind,
      targetType,
      targetProfileId,
      targetTeamId,
      matchId,
      tournamentId,
      categoryId,
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
    return {
      data: result.data.map((s) => toSanctionResponse(s)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Detalle de sanción' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SanctionResponseDto> {
    const sanction = await this.sanctionsService.getSanction(id);
    return toSanctionResponse(sanction);
  }

  @Post(':id/resolve')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Resolver sanción (admin)' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResolveSanctionBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<SanctionResponseDto> {
    const sanction = await this.sanctionsService.resolveSanction({
      sanctionId: id,
      resolvedByProfileId: user.id,
      resolutionNotes: body.resolutionNotes,
    });
    return toSanctionResponse(sanction);
  }

  @Post(':id/cancel')
  @Roles('admin', 'master')
  @ApiOperation({ summary: 'Cancelar sanción (admin)' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CancelSanctionBodyDto,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<SanctionResponseDto> {
    const sanction = await this.sanctionsService.cancelSanction({
      sanctionId: id,
      cancelledByProfileId: user.id,
      cancellationNotes: body.cancellationNotes,
    });
    return toSanctionResponse(sanction);
  }

  @Post(':id/attachments')
  @Roles('admin', 'master')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir adjunto a sanción (admin)' })
  async addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedFileShape,
    @CurrentUser() user: AuthenticatedProfile,
  ): Promise<{ sanction: SanctionResponseDto; assetId: string; url: string }> {
    if (!file) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Archivo requerido (campo "file")',
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.uploadAttachment.execute({
      sanctionId: id,
      uploadedByProfileId: user.id,
      contentType: file.mimetype,
      originalFilename: file.originalname,
      body: file.buffer,
    });
    return {
      sanction: toSanctionResponse(result.sanction),
      assetId: result.assetId,
      url: result.url,
    };
  }
}
