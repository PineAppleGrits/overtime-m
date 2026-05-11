import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CreatePlayerProfileDto } from '@overtime-mono/shared';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AuthService } from '../../application/services/auth.service';
import type { CurrentAuthUser } from '../../auth.types';

class UpdateDocumentNumberDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @Matches(/^\d{7,8}$/, {
    message: 'El DNI debe tener 7 u 8 dígitos numéricos',
  })
  documentNumber: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentAuthUser) {
    return {
      success: true,
      data: user,
    };
  }

  @Patch('profile/document')
  async setDocumentNumber(
    @CurrentUser() user: CurrentAuthUser,
    @Body() dto: UpdateDocumentNumberDto,
  ) {
    const profile = await this.authService.setDocumentNumber(
      user.supabaseUserId,
      dto.documentNumber,
    );

    return {
      success: true,
      message: 'Documento establecido correctamente',
      data: profile,
    };
  }

  @Patch('profile/:profileId/document')
  @UseGuards(RolesGuard)
  @Roles()
  async adminUpdateDocumentNumber(
    @Param('profileId') profileId: string,
    @Body() dto: UpdateDocumentNumberDto,
  ) {
    const profile = await this.authService.adminUpdateDocumentNumber(
      profileId,
      dto.documentNumber,
    );

    return {
      success: true,
      message: 'Documento actualizado correctamente',
      data: profile,
    };
  }

  @Post('create-player-profile')
  async createPlayerProfile(
    @CurrentUser() user: CurrentAuthUser,
    @Body() dto: CreatePlayerProfileDto,
  ) {
    const profile = await this.authService.createPlayerProfile(
      user.supabaseUserId,
      dto,
    );

    return {
      success: true,
      message: 'Player profile created successfully',
      data: profile,
    };
  }
}
