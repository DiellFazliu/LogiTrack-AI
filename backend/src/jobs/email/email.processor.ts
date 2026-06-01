// backend/src/jobs/email/email.processor.ts
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export const EMAIL_QUEUE = 'email';

export interface SendEmailJobData {
  to: string;
  subject: string;
  content: string;
  shipmentId?: string;
  userId?: string;
  organizationId?: string;
}

export interface ReminderEmailJobData {
  to: string;
  shipmentId: string;
  trackingNumber: string;
  userName?: string;
}

export interface WelcomeEmailJobData {
  to: string;
  name: string;
  userId?: string;
  tempPassword?: string;
}

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Konfiguro transporter-in
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false, // true për 465, false për 587
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  @Process('send')
  async handleSend(job: Job<SendEmailJobData>) {
    const { to, subject, content, shipmentId, userId, organizationId } = job.data;
    
    this.logger.log(`📧 Processing email job ${job.id}`);
    this.logger.log(`   To: ${to}`);
    this.logger.log(`   Subject: ${subject}`);
    
    try {
      // Dërgo email real
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: to,
        subject: subject,
        html: this.formatEmailContent(content),
      });
      
      this.logger.log(`✅ Email sent successfully to ${to}`);
      
      return { 
        success: true, 
        sentAt: new Date(),
        to,
        subject,
        shipmentId,
        jobId: job.id
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  @Process('reminder')
  async handleReminder(job: Job<ReminderEmailJobData>) {
    const { to, shipmentId, trackingNumber, userName } = job.data;
    
    const content = `
      <h2>Shipment Reminder</h2>
      <p>Dear ${userName || 'Customer'},</p>
      <p>Your shipment ${trackingNumber} is in transit.</p>
      <p>Track your shipment: <a href="http://localhost:3000/shipments/track/${trackingNumber}">Click here</a></p>
      <br/>
      <p>Best regards,<br/>LogiTrack-AI Team</p>
    `;
    
    this.logger.log(`📧 Processing reminder email to ${to} for shipment ${trackingNumber}`);
    
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: to,
        subject: `Reminder: Shipment ${trackingNumber} Update`,
        html: content,
      });
      
      this.logger.log(`✅ Reminder email sent to ${to}`);
      
      return { success: true, sentAt: new Date(), to, shipmentId, trackingNumber };
    } catch (error) {
      this.logger.error(`❌ Failed to send reminder:`, error);
      throw error;
    }
  }

  @Process('welcome')
  async handleWelcome(job: Job<WelcomeEmailJobData>) {
    const { to, name, userId, tempPassword } = job.data;
    
    const content = `
      <h2>Welcome to LogiTrack-AI!</h2>
      <p>Dear ${name},</p>
      <p>Your account has been successfully created.</p>
      ${tempPassword ? `<p><strong>Temporary password:</strong> ${tempPassword}</p>` : ''}
      <p>Get started: <a href="http://localhost:3000/auth/login">Login here</a></p>
      <br/>
      <p>Best regards,<br/>LogiTrack-AI Team</p>
    `;
    
    this.logger.log(`📧 Sending welcome email to ${to}`);
    
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: to,
        subject: `Welcome to LogiTrack-AI, ${name}!`,
        html: content,
      });
      
      this.logger.log(`✅ Welcome email sent to ${to}`);
      
      return { success: true, sentAt: new Date(), to, userId, name };
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email:`, error);
      throw error;
    }
  }

  @Process('shipment-created')
  async handleShipmentCreated(job: Job<any>) {
    const { to, customerName, trackingNumber, pickupAddress, deliveryAddress } = job.data;
    
    const content = `
      <h2>Shipment Created Successfully!</h2>
      <p>Dear ${customerName},</p>
      <p>Your shipment has been created successfully!</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p><strong>Pickup Address:</strong> ${pickupAddress}</p>
      <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
      <p>Track your shipment: <a href="http://localhost:3000/shipments/track/${trackingNumber}">Click here</a></p>
      <br/>
      <p>Thank you for choosing LogiTrack-AI!</p>
    `;
    
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: to,
        subject: `Shipment Created - ${trackingNumber}`,
        html: content,
      });
      
      this.logger.log(`✅ Shipment created email sent to ${to}`);
      
      return { success: true, sentAt: new Date(), trackingNumber };
    } catch (error) {
      this.logger.error(`❌ Failed to send shipment created email:`, error);
      throw error;
    }
  }

  @Process('shipment-delivered')
  async handleShipmentDelivered(job: Job<any>) {
    const { to, customerName, trackingNumber, deliveryDate } = job.data;
    
    const content = `
      <h2>Shipment Delivered!</h2>
      <p>Dear ${customerName},</p>
      <p>Great news! Your shipment ${trackingNumber} has been delivered successfully!</p>
      <p><strong>Delivery Date:</strong> ${deliveryDate || new Date().toLocaleDateString()}</p>
      <p>Please leave a review: <a href="http://localhost:3000/reviews">Rate your experience</a></p>
      <br/>
      <p>Thank you for using LogiTrack-AI!</p>
    `;
    
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: to,
        subject: `Shipment Delivered - ${trackingNumber}`,
        html: content,
      });
      
      this.logger.log(`✅ Shipment delivered email sent to ${to}`);
      
      return { success: true, sentAt: new Date(), trackingNumber };
    } catch (error) {
      this.logger.error(`❌ Failed to send shipment delivered email:`, error);
      throw error;
    }
  }

  @Process('password-reset')
  async handlePasswordReset(job: Job<any>) {
    const { to, name, resetToken } = job.data;
    
    const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    const content = `
      <h2>Password Reset Request</h2>
      <p>Dear ${name || 'User'},</p>
      <p>You have requested to reset your password.</p>
      <p>Click here to reset your password: <a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br/>
      <p>Best regards,<br/>LogiTrack-AI Team</p>
    `;
    
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: to,
        subject: 'Password Reset Request',
        html: content,
      });
      
      this.logger.log(`✅ Password reset email sent to ${to}`);
      
      return { success: true, sentAt: new Date(), resetToken };
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email:`, error);
      throw error;
    }
  }

  private formatEmailContent(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>LogiTrack-AI</h2>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LogiTrack-AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}