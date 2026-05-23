// src/jobs/report.processor.ts
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';  // ✅ Përdor 'import type' për tipet
import { Logger } from '@nestjs/common';

export const REPORT_QUEUE = 'report';

@Processor(REPORT_QUEUE)
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  @Process('daily')
  async handleDailyReport(job: Job) {
    const { organizationId, date } = job.data;
    this.logger.log(`Generating daily report for organization ${organizationId}`);
    return { success: true, generatedAt: new Date() };
  }

  @Process('monthly')
  async handleMonthlyReport(job: Job) {
    const { organizationId, month, year } = job.data;
    this.logger.log(`Generating monthly report for organization ${organizationId} - ${month}/${year}`);
    return { success: true };
  }

  @Process('driver-performance')
  async handleDriverPerformance(job: Job) {
    const { organizationId, driverId, period } = job.data;
    this.logger.log(`Generating driver performance report for driver ${driverId}`);
    return { success: true };
  }
}