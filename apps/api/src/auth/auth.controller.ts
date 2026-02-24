import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompleteRegisterDto } from './dto/complete-register.dto';
import { IsString } from 'class-validator';

class CreatePlayerProfileDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Obtiene el perfil del usuario autenticado
   *
   * Retorna:
   * - Profile info (email, name, phone, etc.)
   * - Roles asignados
   * - hasPlayerProfile: true si creó su perfil de jugador
   * - playerId: ID del Player si existe
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return {
      success: true,
      data: user,
    };
  }

  @Post('complete-register')
  async completeRegister(
    @CurrentUser() user: any,
    @Body() dto: CompleteRegisterDto,
  ) {
    const profile = await this.authService.completeRegister(user.supabaseUserId, {
      documentNumber: dto.documentNumber,
      dateOfBirth: dto.dateOfBirth,
    });
    return {
      success: true,
      message: 'Registration completed',
      data: profile,
    };
  }

  /**
   * Marca el perfil del usuario como jugador (rol 'player').
   * Solo se puede hacer una vez por perfil.
   */
  @Post('create-player-profile')
  async createPlayerProfile(
    @CurrentUser() user: any,
    @Body() dto: CreatePlayerProfileDto,
  ) {
    const profile = await this.authService.createPlayerProfile(
      user.supabaseUserId,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    );

    return {
      success: true,
      message: 'Player profile created successfully',
      data: profile,
    };
  }
}
