import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from './services/email.service';
import {
  CreateNotificationDto,
  BulkNotificationDto,
  NotificationType,
} from './dto/create-notification.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Crear una notificación para un usuario
   */
  async create(createNotificationDto: CreateNotificationDto) {
    // Verificar que el perfil existe
    const profile = await this.prisma.profile.findUnique({
      where: { id: createNotificationDto.profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const notification = await this.prisma.notification.create({
      data: createNotificationDto,
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Notification created for profile ${createNotificationDto.profileId}: ${createNotificationDto.title}`,
    );

    // Si es email o whatsapp, enviar (implementación futura)
    if (createNotificationDto.type === NotificationType.EMAIL) {
      await this.sendEmail(notification);
    } else if (createNotificationDto.type === NotificationType.WHATSAPP) {
      await this.sendWhatsApp(notification);
    }

    return notification;
  }

  /**
   * Crear notificaciones masivas
   */
  async createBulk(bulkNotificationDto: BulkNotificationDto) {
    const { profileIds, ...notificationData } = bulkNotificationDto;

    // Verificar que los perfiles existen
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true },
    });

    const existingIds = profiles.map((p) => p.id);
    const missingIds = profileIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(`Some profiles not found: ${missingIds.join(', ')}`);
    }

    const notifications = await this.prisma.notification.createMany({
      data: existingIds.map((profileId) => ({
        profileId,
        ...notificationData,
      })),
    });

    this.logger.log(
      `Bulk notification created for ${notifications.count} profiles: ${notificationData.title}`,
    );

    return {
      created: notifications.count,
      skipped: missingIds.length,
      skippedIds: missingIds,
    };
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async findByProfile(
    profileId: string,
    paginationDto: PaginationDto,
    unreadOnly?: boolean,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: any = { profileId };

    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { profileId, read: false },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string, profileId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, profileId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.read) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(profileId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        profileId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.logger.log(`Marked ${result.count} notifications as read for profile ${profileId}`);

    return { markedAsRead: result.count };
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(profileId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { profileId, read: false },
    });
  }

  /**
   * Eliminar notificación
   */
  async remove(id: string, profileId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, profileId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Eliminar todas las notificaciones leídas
   */
  async removeAllRead(profileId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        profileId,
        read: true,
      },
    });

    return { deleted: result.count };
  }

  // ============================================
  // MÉTODOS PRIVADOS PARA ENVÍO
  // ============================================

  private async sendEmail(notification: any): Promise<void> {
    if (!notification.profile?.email) {
      this.logger.warn(`No email found for profile ${notification.profileId}`);
      return;
    }

    const result = await this.emailService.send({
      to: notification.profile.email,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.link ? `<p><a href="${notification.link}">Ver más</a></p>` : ''}
        </div>
      `,
    });

    if (result.success) {
      this.logger.log(`Email sent to ${notification.profile.email}: ${result.id}`);
    } else {
      this.logger.error(`Failed to send email: ${result.error}`);
    }
  }

  private async sendWhatsApp(notification: any): Promise<void> {
    // TODO: Implementar envío de WhatsApp con WhatsApp Business API
    // Requiere configuración de WhatsApp Business API
    this.logger.log(`[WHATSAPP] Would send WhatsApp to profile ${notification.profileId}`);
  }

  // ============================================
  // MÉTODOS HELPER PARA OTROS MÓDULOS
  // ============================================

  /**
   * Notificar sobre inscripción aprobada
   */
  async notifyRegistrationApproved(
    profileId: string,
    teamName: string,
    tournamentName: string,
    categoryName: string,
  ) {
    return this.create({
      profileId,
      type: NotificationType.IN_APP,
      title: 'Inscripción Aprobada',
      message: `Tu equipo "${teamName}" ha sido aprobado en el torneo "${tournamentName}" - Categoría ${categoryName}`,
      link: `/my-teams`,
    });
  }

  /**
   * Notificar sobre partido próximo
   */
  async notifyUpcomingMatch(
    profileId: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: Date,
    venue: string,
  ) {
    const dateStr = matchDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return this.create({
      profileId,
      type: NotificationType.IN_APP,
      title: 'Partido Próximo',
      message: `${homeTeam} vs ${awayTeam} - ${dateStr} en ${venue}`,
    });
  }

  /**
   * Notificar sobre asignación de staff a partido
   */
  async notifyStaffAssignment(
    profileId: string,
    role: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: Date,
  ) {
    const dateStr = matchDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return this.create({
      profileId,
      type: NotificationType.IN_APP,
      title: 'Nueva Asignación',
      message: `Has sido asignado como ${role} para ${homeTeam} vs ${awayTeam} el ${dateStr}`,
      link: `/staff/my-assignments`,
    });
  }
}
