// backend/src/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor, EMAIL_QUEUE } from './email/email.processor';
import { EmailService } from './email/email.service';
import { ConfigModule } from '@nestjs/config'; // ✅ Shto

@Module({
  imports: [
    ConfigModule, // ✅ Shto këtë
    BullModule.registerQueue(
      { 
        name: EMAIL_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
  ],
  providers: [EmailProcessor, EmailService],
  exports: [EmailService, BullModule],
})
export class JobsModule {}