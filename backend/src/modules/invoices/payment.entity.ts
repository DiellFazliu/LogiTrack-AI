// src/modules/invoices/payment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  ONLINE = 'online',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_id' })
  invoiceId!: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CARD })
  method!: PaymentMethod;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId!: string;

  @Column({ default: 'pending' })
  status!: string;

  @CreateDateColumn({ name: 'paid_at' })
  paidAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}