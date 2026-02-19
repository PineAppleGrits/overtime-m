import { IsString, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  IN_APP = 'in_app',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID del perfil destinatario' })
  @IsUUID()
  profileId: string;

  @ApiProperty({ description: 'Tipo de notificación', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Título de la notificación' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Enlace asociado a la notificación' })
  @IsOptional()
  @IsString()
  link?: string;
}

export class BulkNotificationDto {
  @ApiProperty({ description: 'IDs de los perfiles destinatarios', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  profileIds: string[];

  @ApiProperty({ description: 'Tipo de notificación', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Título de la notificación' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Enlace asociado a la notificación' })
  @IsOptional()
  @IsString()
  link?: string;
}
