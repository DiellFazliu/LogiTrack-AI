import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, NotificationQueryDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a notification for a user' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Post('role/:role')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create notification for all users with a role' })
  @ApiResponse({ status: 201, description: 'Notifications created for all users with the role' })
  async createForRole(
    @Param('role') role: string,
    @Body() body: { title: string; message: string; data?: any; type?: string }
  ) {
    return this.notificationsService.createForRole(role, body.title, body.message, body.data, body.type);
  }

  @Post('organization')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create notification for entire organization' })
  @ApiResponse({ status: 201, description: 'Notifications created for the entire organization' })
  async createForOrganization(
    @Request() req,
    @Body() body: { title: string; message: string; data?: any; type?: string }
  ) {
    // ✅ Kontrollo nëse organizationId ekziston
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      throw new BadRequestException('User does not belong to any organization');
    }
    
    return this.notificationsService.createForOrganization(
      organizationId,
      body.title,
      body.message,
      body.data,
      body.type
    );
  }

  @Post('critical')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Send critical notification (email + in-app)' })
  @ApiResponse({ status: 201, description: 'Critical notification sent' })
  async sendCriticalNotification(
    @Body() body: { userId: string; title: string; message: string; data?: any },
    @Request() req
  ) {
    await this.notificationsService.sendCriticalNotification(
      body.userId,
      body.title,
      body.message,
      body.data
    );
    return { message: 'Critical notification sent successfully' };
  }

  @Post('shipment')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Send shipment status notification' })
  @ApiResponse({ status: 201, description: 'Shipment notification sent' })
  async sendShipmentNotification(
    @Body() body: { userId: string; shipmentId: string; trackingNumber: string; status: string }
  ) {
    await this.notificationsService.sendShipmentNotification(
      body.userId,
      body.shipmentId,
      body.trackingNumber,
      body.status
    );
    return { message: 'Shipment notification sent successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getMyNotifications(@Request() req, @Query() query: NotificationQueryDto) {
    this.logger.log(`User ID: ${req.user.id}`);
    this.logger.log(`Query params: ${JSON.stringify(query)}`);
    
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    
    const result = await this.notificationsService.findAll(req.user.id, {
      isRead: query.isRead,
      limit,
      offset,
    });
    
    return result;
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req) {
    const { unreadCount } = await this.notificationsService.findAll(req.user.id, { isRead: false, limit: 1 });
    return { unreadCount };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.notificationsService.delete(id, req.user.id);
    return { message: 'Notification deleted successfully' };
  }
}