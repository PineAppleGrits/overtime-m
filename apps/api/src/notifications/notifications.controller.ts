import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, BulkNotificationDto } from './dto/create-notification.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear notificación (admin)' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('bulk')
  @Roles('admin')
  @ApiOperation({ summary: 'Crear notificaciones masivas (admin)' })
  createBulk(@Body() bulkNotificationDto: BulkNotificationDto) {
    return this.notificationsService.createBulk(bulkNotificationDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mis notificaciones' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  findMine(
    @CurrentUser('id') profileId: string,
    @Query() paginationDto: PaginationDto,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const unreadOnlyBool = unreadOnly === 'true';
    return this.notificationsService.findByProfile(
      profileId,
      paginationDto,
      unreadOnlyBool,
    );
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Obtener conteo de notificaciones no leídas' })
  async getUnreadCount(@CurrentUser('id') profileId: string) {
    const count = await this.notificationsService.getUnreadCount(profileId);
    return { unreadCount: count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') profileId: string,
  ) {
    return this.notificationsService.markAsRead(id, profileId);
  }

  @Post('me/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  markAllAsRead(@CurrentUser('id') profileId: string) {
    return this.notificationsService.markAllAsRead(profileId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') profileId: string,
  ) {
    return this.notificationsService.remove(id, profileId);
  }

  @Delete('me/read')
  @ApiOperation({ summary: 'Eliminar todas las notificaciones leídas' })
  removeAllRead(@CurrentUser('id') profileId: string) {
    return this.notificationsService.removeAllRead(profileId);
  }
}
