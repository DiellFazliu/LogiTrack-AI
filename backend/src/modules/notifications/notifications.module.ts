import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EMAIL_QUEUE } from '../../jobs/email.processor';
import { UsersModule } from '../users/users.module'; 

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
    UsersModule,
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}