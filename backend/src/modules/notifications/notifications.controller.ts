// backend/src/modules/notifications/notifications.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a notification for a user' })
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Post('role/:role')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create notification for all users with a role' })
  async createForRole(
    @Param('role') role: string,
    @Body() body: { title: string; message: string; data?: any; type?: string }
  ) {
    return this.notificationsService.createForRole(role, body.title, body.message, body.data, body.type);
  }

  @Post('organization')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create notification for entire organization' })
  async createForOrganization(
    @Request() req,
    @Body() body: { title: string; message: string; data?: any; type?: string }
  ) {
    return this.notificationsService.createForOrganization(
      req.user.organizationId,
      body.title,
      body.message,
      body.data,
      body.type
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  async getMyNotifications(@Request() req, @Query() query: NotificationQueryDto) {
    console.log('User ID:', req.user.id);
    console.log('Query params:', query);
    
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    
    const result = await this.notificationsService.findAll(req.user.id, {
      isRead: query.isRead,
      limit,
      offset,
    });
    
    console.log('Notifications found:', result.items.length);
    return result;
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@Request() req) {
    const { unreadCount } = await this.notificationsService.findAll(req.user.id, { isRead: false, limit: 1 });
    return { unreadCount };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.notificationsService.delete(id, req.user.id);
    return { message: 'Notification deleted successfully' };
  }
}