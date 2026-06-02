import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, JobId } from 'bull';  // ✅ Përdor 'import type' për Queue dhe JobId
import { 
  EMAIL_QUEUE, 
  SendEmailJobData, 
  ReminderEmailJobData, 
  WelcomeEmailJobData 
} from './email.processor';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue,
  ) {}

  /**
   * Dërgon një email të thjeshtë
   */
  async sendEmail(to: string, subject: string, content: string, metadata?: any): Promise<JobId> {  // ✅ Kthen JobId
    const jobData: SendEmailJobData = { 
      to, 
      subject, 
      content,
      userId: metadata?.userId,
      organizationId: metadata?.organizationId,
      shipmentId: metadata?.shipmentId,
    };
    
    const job = await this.emailQueue.add('send', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      priority: 1,
    });
    
    this.logger.log(`📧 Email queued: ${job.id} - To: ${to} - Subject: ${subject}`);
    return job.id;  // ✅ Kthen JobId (mund të jetë string ose number)
  }

  /**
   * Dërgon email kujtese për një dërgesë
   */
  async sendReminderEmail(to: string, shipmentId: string, trackingNumber: string, userName?: string): Promise<JobId> {
    const jobData: ReminderEmailJobData = {
      to,
      shipmentId,
      trackingNumber,
      userName,
    };
    
    const job = await this.emailQueue.add('reminder', jobData, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      priority: 2,
      delay: 0,
    });
    
    this.logger.log(`📧 Reminder email queued: ${job.id} - To: ${to} - Shipment: ${trackingNumber}`);
    return job.id;
  }

  /**
   * Dërgon email mirëseardhjeje për përdorues të ri
   */
  async sendWelcomeEmail(to: string, name: string, userId?: string, tempPassword?: string): Promise<JobId> {
    const jobData: WelcomeEmailJobData = {
      to,
      name,
      userId,
      tempPassword,
    };
    
    const job = await this.emailQueue.add('welcome', jobData, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      priority: 1,
    });
    
    this.logger.log(`📧 Welcome email queued: ${job.id} - To: ${to} - User: ${name}`);
    return job.id;
  }

  /**
   * Dërgon email kur krijohet një dërgesë e re
   */
  async sendShipmentCreatedEmail(
    to: string, 
    customerName: string, 
    trackingNumber: string, 
    pickupAddress: string, 
    deliveryAddress: string
  ): Promise<JobId> {
    const job = await this.emailQueue.add('shipment-created', {
      to,
      customerName,
      trackingNumber,
      pickupAddress,
      deliveryAddress,
    }, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      priority: 1,
    });
    
    this.logger.log(`📧 Shipment created email queued: ${job.id} - To: ${to} - Tracking: ${trackingNumber}`);
    return job.id;
  }

  /**
   * Dërgon email kur dërgesa dorëzohet
   */
  async sendShipmentDeliveredEmail(
    to: string, 
    customerName: string, 
    trackingNumber: string, 
    deliveryDate?: Date
  ): Promise<JobId> {
    const job = await this.emailQueue.add('shipment-delivered', {
      to,
      customerName,
      trackingNumber,
      deliveryDate: deliveryDate || new Date(),
    }, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      priority: 1,
    });
    
    this.logger.log(`📧 Shipment delivered email queued: ${job.id} - To: ${to} - Tracking: ${trackingNumber}`);
    return job.id;
  }

  /**
   * Dërgon email për rivendosjen e fjalëkalimit
   */
  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<JobId> {
    const job = await this.emailQueue.add('password-reset', {
      to,
      name,
      resetToken,
    }, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      priority: 1,
    });
    
    this.logger.log(`📧 Password reset email queued: ${job.id} - To: ${to}`);
    return job.id;
  }

  /**
   * Dërgon shumë email njëherësh (bulk)
   */
  async sendBulkEmails(emails: Array<{
    to: string;
    subject: string;
    content: string;
    metadata?: any;
  }>): Promise<JobId[]> {
    const jobs = emails.map(email => ({
      name: 'send',
      data: {
        to: email.to,
        subject: email.subject,
        content: email.content,
        userId: email.metadata?.userId,
        organizationId: email.metadata?.organizationId,
      },
      opts: {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
      },
    }));
    
    const createdJobs = await this.emailQueue.addBulk(jobs);
    this.logger.log(`📧 ${jobs.length} emails queued for bulk sending`);
    
    return createdJobs.map(job => job.id);
  }

  /**
   * Dërgon email me vonesë (për reminder)
   */
  async sendDelayedEmail(
    to: string, 
    subject: string, 
    content: string, 
    delayMs: number,
    metadata?: any
  ): Promise<JobId> {
    const jobData: SendEmailJobData = {
      to,
      subject,
      content,
      userId: metadata?.userId,
      organizationId: metadata?.organizationId,
    };
    
    const job = await this.emailQueue.add('send', jobData, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      delay: delayMs,
    });
    
    this.logger.log(`📧 Delayed email queued: ${job.id} - To: ${to} - Delay: ${delayMs}ms`);
    return job.id;
  }

  /**
   * Merr statusin e queue-s
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
      this.emailQueue.isPaused(),
    ]);
    
    return { waiting, active, completed, failed, delayed, paused: isPaused };
  }

  /**
   * Merr të gjitha job-at e dështuara
   */
  async getFailedJobs(): Promise<any[]> {
    const failedJobs = await this.emailQueue.getFailed();
    return failedJobs.map(job => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      stacktrace: job.stacktrace,
    }));
  }

  /**
   * Merr një job specifik
   */
  async getJob(jobId: string): Promise<any> {
    const job = await this.emailQueue.getJob(jobId);
    if (!job) return null;
    
    return {
      id: job.id,
      data: job.data,
      state: await job.getState(),
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Riprovon një job të dështuar
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    const job = await this.emailQueue.getJob(jobId);
    if (job && (await job.getState()) === 'failed') {
      await job.retry();
      this.logger.log(`🔄 Retrying failed job: ${jobId}`);
      return true;
    }
    this.logger.warn(`⚠️ Job ${jobId} not found or not failed`);
    return false;
  }

  /**
   * Fshin një job (vetëm nëse nuk është duke u procesuar)
   */
  async removeJob(jobId: string): Promise<boolean> {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`🗑️ Job removed: ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Pastron të gjitha job-at e përfunduara
   */
  async cleanCompletedJobs(): Promise<number> {
    const jobs = await this.emailQueue.clean(0, 'completed');
    this.logger.log(`🧹 Cleaned ${jobs.length} completed jobs`);
    return jobs.length;
  }

  /**
   * Pastron të gjitha job-at e dështuara
   */
  async cleanFailedJobs(): Promise<number> {
    const jobs = await this.emailQueue.clean(0, 'failed');
    this.logger.log(`🧹 Cleaned ${jobs.length} failed jobs`);
    return jobs.length;
  }

  /**
   * Pauzon queue-n (ndalon procesimin)
   */
  async pauseQueue(): Promise<void> {
    await this.emailQueue.pause();
    this.logger.warn(`⏸️ Email queue paused`);
  }

  /**
   * Rifillon queue-n
   */
  async resumeQueue(): Promise<void> {
    await this.emailQueue.resume();
    this.logger.log(`▶️ Email queue resumed`);
  }
}