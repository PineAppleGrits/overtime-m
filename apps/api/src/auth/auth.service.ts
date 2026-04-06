import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
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
      medicalCertificateUrl: profile.medicalCertificateUrl,
      swornStatementUrl: profile.swornStatementUrl,
      role: profile.role,
      hasPlayerProfile,
      profileId: profile.id,
      createdAt: profile.createdAt,
    };
  }

  /**
   * Permite al usuario establecer su DNI por primera vez.
   * Una vez establecido, no puede ser modificado por el propio usuario.
   */
  async setDocumentNumber(
    supabaseUserId: string,
    documentNumber: string,
  ): Promise<Record<string, unknown>> {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.documentNumber) {
      throw new ForbiddenException(
        'El número de documento ya fue establecido. Contactá a un administrador para modificarlo.',
      );
    }

    const updated = await this.prisma.profile.update({
      where: { supabaseUserId },
      data: { documentNumber },
    });

    this.logger.log(`Document number set for user: ${supabaseUserId}`);

    return this.formatProfileResponse(updated);
  }

  /**
   * Permite a un usuario autorizado modificar el DNI de cualquier perfil.
   * Usado por admin/superadmin para corregir DNIs ya establecidos.
   */
  async adminUpdateDocumentNumber(
    profileId: string,
    documentNumber: string,
  ): Promise<Record<string, unknown>> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const updated = await this.prisma.profile.update({
      where: { id: profileId },
      data: { documentNumber },
    });

    this.logger.log(
      `Document number updated by admin for profile: ${profileId}`,
    );

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
