import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_ANON_KEY') || '',
    );
  }

  /**
   * Valida un token de Supabase y retorna el usuario
   */
  async validateSupabaseToken(token: string): Promise<User> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      return user;
    } catch (error) {
      this.logger.error('Token validation failed', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Crea un perfil de jugador para un usuario
   * - Puede ser llamado por cualquier usuario en cualquier momento
   * - Verifica que no exista Player ya
   * - Agrega rol 'player' si no lo tiene
   */
  async createPlayerProfile(
    supabaseUserId: string,
    playerData: { firstName: string; lastName: string },
  ): Promise<any> {
    // Verificar que no exista Player
    const existingPlayer = await this.prisma.player.findUnique({
      where: { supabaseUserId },
    });

    if (existingPlayer) {
      throw new Error('Player profile already exists');
    }

    // Crear Player
    const player = await this.prisma.player.create({
      data: {
        supabaseUserId,
        firstName: playerData.firstName,
        lastName: playerData.lastName,
      },
    });

    // Verificar si tiene rol 'player'
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
      include: {
        profileRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const hasPlayerRole = profile?.profileRoles.some(
      (pr) => pr.role.name === 'player',
    );

    // Si no tiene rol 'player', agregarlo
    if (profile && !hasPlayerRole) {
      await this.assignRoleToProfile(profile.id, 'player');
    }

    this.logger.log(`Player profile created for user: ${supabaseUserId}`);

    return player;
  }

  /**
   * Asigna un rol a un perfil
   */
  private async assignRoleToProfile(
    profileId: string,
    roleName: string,
  ): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (role) {
      await this.prisma.profileRole.create({
        data: {
          profileId,
          roleId: role.id,
        },
      });
      this.logger.log(`Role '${roleName}' assigned to profile: ${profileId}`);
    }
  }

  /**
   * Obtiene el perfil completo del usuario actual
   */
  async getProfile(supabaseUserId: string): Promise<any> {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
      include: {
        profileRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.formatProfileResponse(profile, supabaseUserId);
  }

  /**
   * Formatea la respuesta del perfil
   */
  private async formatProfileResponse(
    profile: any,
    supabaseUserId: string,
  ): Promise<any> {
    // Buscar Player asociado a este supabaseUserId
    const player = await this.prisma.player.findUnique({
      where: { supabaseUserId },
    });

    return {
      id: profile.id,
      supabaseUserId: profile.supabaseUserId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      phone: profile.phone,
      phoneVerified: profile.phoneVerified,
      documentNumber: profile.documentNumber,
      documentVerified: profile.documentVerified,
      dateOfBirth: profile.dateOfBirth,
      roles: profile.profileRoles.map((pr) => pr.role.name),
      hasPlayerProfile: !!player, // true si creó su perfil de jugador
      playerId: player?.id,
      playerName: player ? `${player.firstName} ${player.lastName}` : null,
      createdAt: profile.createdAt,
    };
  }

  /**
   * Verifica si un usuario tiene un rol específico
   */
  async hasRole(supabaseUserId: string, roleName: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
      include: {
        profileRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!profile) {
      return false;
    }

    return profile.profileRoles.some((pr) => pr.role.name === roleName);
  }
}
