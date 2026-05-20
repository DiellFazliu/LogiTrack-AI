// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';  // ✅ Përdor 'import type' për tipet
import { EMAIL_QUEUE } from '../../jobs/email.processor';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;  // ✅ Shto | null dhe inicializo

  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private emailQueue: Queue,
    private configService: ConfigService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const user = this.configService.get('EMAIL_USER');
    const pass = this.configService.get('EMAIL_PASS');
    
    if (user && pass && user !== 'your-email@gmail.com') {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('EMAIL_HOST'),
        port: this.configService.get('EMAIL_PORT'),
        secure: false,
        auth: { user, pass },
      });
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn('Email credentials not configured. Email sending disabled.');
    }
  }

  async sendEmail(to: string, subject: string, content: string, shipmentId?: string) {
    const job = await this.emailQueue.add('send', {
      to,
      subject,
      content,
      shipmentId,
    });
    
    this.logger.log(`Email job added to queue with id ${job.id}`);
    return { jobId: job.id, status: 'queued' };
  }

  async sendShipmentStatusUpdate(to: string, trackingNumber: string, status: string) {
    const subject = `Shipment ${trackingNumber} Status Update`;
    const content = `Your shipment ${trackingNumber} has been updated to: ${status}`;
    return this.sendEmail(to, subject, content, trackingNumber);
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to LogiTrack AI';
    const content = `Hello ${name}, welcome to LogiTrack AI! Start tracking your shipments today.`;
    
    const job = await this.emailQueue.add('welcome', { to, name });
    return { jobId: job.id, status: 'queued' };
  }
}