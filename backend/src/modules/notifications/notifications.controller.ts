// src/modules/notifications/notifications.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Notifications')  // ← Ky tag e shfaq në Swagger
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('send-email')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Send email notification' })
  @ApiResponse({ status: 200, description: 'Email queued successfully' })
  @ApiBody({ 
    schema: { 
      type: 'object',
      properties: {
        to: { type: 'string', example: 'user@example.com' },
        subject: { type: 'string', example: 'Shipment Update' },
        content: { type: 'string', example: 'Your shipment has been delivered' }
      }
    }
  })
  async sendEmail(
    @Body('to') to: string,
    @Body('subject') subject: string,
    @Body('content') content: string,
  ) {
    return this.notificationsService.sendEmail(to, subject, content);
  }

  @Post('send-welcome')
  @ApiOperation({ summary: 'Send welcome email' })
  @ApiResponse({ status: 200, description: 'Welcome email queued' })
  @ApiBody({ 
    schema: { 
      type: 'object',
      properties: {
        to: { type: 'string', example: 'newuser@example.com' },
        name: { type: 'string', example: 'John Doe' }
      }
    }
  })
  async sendWelcome(
    @Body('to') to: string,
    @Body('name') name: string,
  ) {
    return this.notificationsService.sendWelcomeEmail(to, name);
  }
}