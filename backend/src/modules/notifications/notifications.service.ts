// backend/src/modules/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from './dto/create-notification.dto';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    return this.notificationRepository.save(notification);
  }

  async createForRole(role: string, title: string, message: string, data?: any, type: string = 'in_app'): Promise<Notification[]> {
    // Gjej të gjithë përdoruesit me rolin e specifikuar
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

    return this.notificationRepository.save(notifications);
  }

  async createForOrganization(organizationId: string, title: string, message: string, data?: any, type: string = 'in_app'): Promise<Notification[]> {
    const users = await this.userRepository.find({
      where: { organizationId, isActive: true },
    });

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

    return this.notificationRepository.save(notifications);
  }

// backend/src/modules/notifications/notifications.service.ts
async findAll(userId: string, query: { isRead?: boolean; limit?: number; offset?: number }): Promise<{ items: Notification[]; total: number; unreadCount: number }> {
  const { isRead, limit = 50, offset = 0 } = query;
  
  console.log('findAll called with:', { userId, isRead, limit, offset });
  
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

  console.log('Items found:', items.length, 'Total:', total, 'Unread:', unreadCount);

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
}