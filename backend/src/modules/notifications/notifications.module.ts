// backend/src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { JobsModule } from '../../jobs/jobs.module';  

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    UsersModule,
    JobsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}  