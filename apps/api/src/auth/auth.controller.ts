import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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

  /**
   * Crea un perfil de jugador para el usuario actual
   * - Cualquier usuario puede crear su perfil de jugador
   * - Automáticamente agrega rol 'player' si no lo tiene
   * - Solo se puede crear una vez
   */
  @Post('create-player-profile')
  async createPlayerProfile(
    @CurrentUser() user: any,
    @Body() dto: CreatePlayerProfileDto,
  ) {
    const player = await this.authService.createPlayerProfile(
      user.supabaseUserId,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    );

    return {
      success: true,
      message: 'Player profile created successfully',
      data: player,
    };
  }
}
