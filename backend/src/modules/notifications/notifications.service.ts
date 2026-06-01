// backend/src/modules/notifications/notifications.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../users/user.entity';
import { EmailService } from '../../jobs/email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: createDto.userId,
      type: createDto.type || 'in_app',
      title: createDto.title,
      message: createDto.message,
      data: createDto.data,
      isRead: false,
    });
    
    const savedNotification = await this.notificationRepository.save(notification);
    
    if (createDto.type === 'email' && createDto.userId) {
      
      const user = await this.userRepository.findOne({ where: { id: createDto.userId } });
      if (user && user.email) {
        await this.emailService.sendEmail(
          user.email,
          createDto.title,
          createDto.message,
          { notificationId: savedNotification.id, userId: createDto.userId }
        );
        this.logger.log(`📧 Email notification queued for user ${user.email}`);
      }
    }
    
    return savedNotification;
  }

  async createForRole(role: string, title: string, message: string, data?: any, type: string = 'in_app'): Promise<Notification[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.name = :role', { role })
      .getMany();

    const notifications = users.map(user => 
      this.notificationRepository.create({
        userId: user.id,
        type: type as any,
        title,
        message,
        data,
        isRead: false,
      })
    );

    const savedNotifications = await this.notificationRepository.save(notifications);
    
    if (type === 'email') {
      for (const user of users) {
        if (user.email) {
          await this.emailService.sendEmail(
            user.email,
            title,
            message,
            { role, notificationCount: notifications.length }
          );
          this.logger.log(`📧 Email notification queued for role ${role} to ${user.email}`);
        }
      }
    }
    
    return savedNotifications;
  }

  // ✅ RREGULLUAR: Parametri pranon string | undefined
  async createForOrganization(organizationId: string | undefined, title: string, message: string, data?: any, type: string = 'in_app'): Promise<Notification[]> {
    // ✅ Kontrollo nëse organizationId ekziston
    if (!organizationId) {
      this.logger.warn('Organization ID is required. Cannot create notifications.');
      return [];
    }
    
    const users = await this.userRepository.find({
      where: { organizationId, isActive: true },
    });

    if (users.length === 0) {
      this.logger.warn(`No active users found for organization ${organizationId}`);
      return [];
    }

    const notifications = users.map(user => 
      this.notificationRepository.create({
        userId: user.id,
        type: type as any,
        title,
        message,
        data,
        isRead: false,
      })
    );

    const savedNotifications = await this.notificationRepository.save(notifications);
    
    if (type === 'email') {
      for (const user of users) {
        if (user.email) {
          await this.emailService.sendEmail(
            user.email,
            title,
            message,
            { organizationId, notificationCount: notifications.length }
          );
          this.logger.log(`📧 Email notification queued for organization ${organizationId} to ${user.email}`);
        }
      }
    }
    
    return savedNotifications;
  }

  async findAll(userId: string, query: { isRead?: boolean; limit?: number; offset?: number }): Promise<{ items: Notification[]; total: number; unreadCount: number }> {
    const { isRead, limit = 50, offset = 0 } = query;
    
    this.logger.debug(`findAll called with: userId=${userId}, isRead=${isRead}, limit=${limit}, offset=${offset}`);
    
    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    this.logger.debug(`Items found: ${items.length}, Total: ${total}, Unread: ${unreadCount}`);

    return { items, total, unreadCount };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepository.remove(notification);
  }

  async sendCriticalNotification(userId: string, title: string, message: string, data?: any): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.email) {
      await this.create({
        userId,
        type: 'email',
        title,
        message,
        data,
      });
      
      await this.emailService.sendEmail(
        user.email,
        `🔴 CRITICAL: ${title}`,
        message,
        { userId, critical: true, ...data }
      );
      
      this.logger.warn(`📧 Critical notification sent to ${user.email}: ${title}`);
    }
  }

  async sendShipmentNotification(userId: string, shipmentId: string, trackingNumber: string, status: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.email) {
      const title = `Shipment ${trackingNumber} - ${status}`;
      const message = `Your shipment ${trackingNumber} has been ${status}. Track it now.`;
      
      await this.create({
        userId,
        type: 'email',
        title,
        message,
        data: { shipmentId, trackingNumber, status },
      });
      
      this.logger.log(`📧 Shipment notification queued for ${user.email}: ${trackingNumber} - ${status}`);
    }
  }
}