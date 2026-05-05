import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UsersService } from '../../application/services/users.service';
import { toProfileResponseDto } from '../mappers/profile.mapper';

interface UploadedFileShape {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/**
 * ProfileController — endpoints públicos del usuario autenticado sobre
 * SU propio perfil. Distinto a UsersController (admin sobre cualquier perfil).
 */
@ApiTags('profiles')
@ApiBearerAuth('access-token')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Perfil propio del usuario autenticado' })
  async me(@CurrentUser('id') profileId: string) {
    const profile = await this.users.findOne(profileId);
    return toProfileResponseDto(profile);
  }

  @Get('me/status')
  @ApiOperation({
    summary: 'Estado activo/inactivo del perfil propio (RN-037)',
  })
  async myStatus(@CurrentUser('id') profileId: string) {
    return this.users.getActiveStatus(profileId);
  }

  @Post('me/dni-photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Sube foto de DNI propia (RN-036). Campo "file" multipart. Trigger verificación automática (DP-009 stub).',
  })
  async uploadDniPhoto(
    @UploadedFile() file: UploadedFileShape,
    @CurrentUser('id') profileId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo "file" requerido');
    }
    const result = await this.users.uploadDni({
      profileId,
      uploadedByProfileId: profileId,
      contentType: file.mimetype,
      originalFilename: file.originalname,
      body: file.buffer,
    });
    return {
      profile: toProfileResponseDto(result.profile),
      assetId: result.assetId,
      verified: result.verified,
      requiresManualReview: result.requiresManualReview,
    };
  }
}
