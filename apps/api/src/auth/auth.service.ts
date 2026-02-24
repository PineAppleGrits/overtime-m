import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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
   * Marca el perfil del usuario como jugador (agrega rol 'player').
   * Solo se puede hacer una vez por perfil.
   */
  async createPlayerProfile(
    supabaseUserId: string,
    playerData: { firstName: string; lastName: string },
  ): Promise<any> {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.role === 'player') {
      throw new Error('Player profile already exists');
    }

    const name =
      profile.name?.trim() ||
      `${playerData.firstName ?? ''} ${playerData.lastName ?? ''}`.trim() ||
      profile.email ||
      'User';

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        role: 'player',
        ...(name !== profile.name && { name }),
      },
    });

    this.logger.log(`Player profile created for user: ${supabaseUserId}`);

    return this.prisma.profile.findUnique({
      where: { id: profile.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });
  }

  /**
   * Obtiene el perfil completo del usuario actual
   */
  async getProfile(supabaseUserId: string): Promise<any> {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.formatProfileResponse(profile);
  }

  private formatProfileResponse(profile: any): any {
    const hasPlayerProfile = profile.role === 'player';
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
      role: profile.role,
      hasPlayerProfile,
      profileId: profile.id,
      createdAt: profile.createdAt,
    };
  }

  /**
   * Completes registration: sets DNI (and optional dateOfBirth).
   * If a profile exists with that DNI and no supabaseUserId, deletes the current
   * profile and links the auth user to the existing profile.
   */
  async completeRegister(
    supabaseUserId: string,
    data: { documentNumber: string; dateOfBirth?: string },
  ): Promise<any> {
    const currentProfile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
    });

    if (!currentProfile) {
      throw new NotFoundException('Profile not found');
    }

    if (currentProfile.documentNumber != null) {
      throw new BadRequestException('Registration already completed');
    }

    const documentNumber = data.documentNumber.trim();
    const existingByDni = await this.prisma.profile.findFirst({
      where: {
        documentNumber,
        supabaseUserId: null,
        deletedAt: null,
      },
    });

    if (existingByDni) {
      await this.prisma.$transaction(async (tx) => {
        await tx.profile.delete({ where: { id: currentProfile.id } });
        await tx.profile.update({
          where: { id: existingByDni.id },
          data: {
            supabaseUserId,
            email: currentProfile.email,
            name: currentProfile.name,
            avatarUrl: currentProfile.avatarUrl,
            ...(data.dateOfBirth && {
              dateOfBirth: new Date(data.dateOfBirth),
            }),
          },
        });
      });

      this.logger.log(
        `Linked existing profile ${existingByDni.id} to supabase user ${supabaseUserId}`,
      );

      const linked = await this.prisma.profile.findUnique({
        where: { id: existingByDni.id },
      });
      return this.formatProfileResponse(linked!);
    }

    const dateOfBirth = data.dateOfBirth
      ? new Date(data.dateOfBirth)
      : undefined;
    const updated = await this.prisma.profile.update({
      where: { id: currentProfile.id },
      data: {
        documentNumber,
        ...(dateOfBirth && { dateOfBirth }),
      },
    });

    return this.formatProfileResponse(updated);
  }

  /**
   * Verifica si un usuario tiene un rol específico
   */
  async hasRole(supabaseUserId: string, roleName: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
    });

    if (!profile) {
      return false;
    }

    return profile.role === roleName;
  }
}
