// src/jobs/email.processor.ts
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';

export const EMAIL_QUEUE = 'email';

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send')
  async handleSend(job: Job) {
    const { to, subject, content, shipmentId } = job.data;
    this.logger.log(`Sending email to ${to}: ${subject}`);
    
    this.logger.log(`Email sent to ${to}`);
    return { success: true, sentAt: new Date() };
  }

  @Process('reminder')
  async handleReminder(job: Job) {
    const { to, shipmentId, trackingNumber } = job.data;
    this.logger.log(`Sending reminder to ${to} for shipment ${trackingNumber}`);
    return { success: true };
  }

  @Process('welcome')
  async handleWelcome(job: Job) {
    const { to, name } = job.data;
    this.logger.log(`Sending welcome email to ${to} for user ${name}`);
    return { success: true };
  }
}