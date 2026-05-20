import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor, EMAIL_QUEUE } from './email.processor';
import { ReportProcessor, REPORT_QUEUE } from './report.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: EMAIL_QUEUE },
      { name: REPORT_QUEUE },
    ),
  ],
  providers: [EmailProcessor, ReportProcessor],
  exports: [BullModule],
})
export class JobsModule {}