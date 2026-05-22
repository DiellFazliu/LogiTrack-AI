import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Shipment } from '../shipments/shipment.entity';
import { User } from '../users/user.entity';

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ReturnReason {
  DAMAGED = 'damaged',
  WRONG_ITEM = 'wrong_item',
  MISSING_ITEM = 'missing_item',
  LATE_DELIVERY = 'late_delivery',
  CUSTOMER_CANCELLED = 'customer_cancelled',
  OTHER = 'other',
}

@Entity('returns')
@Index(['original_shipment_id'])
@Index(['return_status'])
export class Return {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'original_shipment_id' })
  originalShipmentId!: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'original_shipment_id' })
  originalShipment!: Shipment;

  @Column({ name: 'organization_id', nullable: true })
  organizationId!: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer!: User;

  @Column({ name: 'return_number', unique: true })
  returnNumber!: string;

  @Column({ type: 'enum', enum: ReturnReason, name: 'return_reason' })
  returnReason!: ReturnReason;

  @Column({ type: 'text', nullable: true })
  reasonDescription!: string;

  @Column({ type: 'enum', enum: ReturnStatus, name: 'return_status', default: ReturnStatus.REQUESTED })
  returnStatus!: ReturnStatus;

  // Adresat (vetëm tekst, pa koordinata)
  @Column({ name: 'pickup_address', type: 'text', nullable: true })
  pickupAddress!: string;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress!: string;

  // Datat e planifikuara
  @Column({ name: 'pickup_scheduled_date', type: 'date', nullable: true })
  pickupScheduledDate!: Date;

  // Datat e përfundimit
  @Column({ name: 'pickup_completed_at', type: 'timestamp', nullable: true })
  pickupCompletedAt!: Date;

  @Column({ name: 'delivery_completed_at', type: 'timestamp', nullable: true })
  deliveryCompletedAt!: Date;

  // Shoferi dhe automjeti
  @Column({ name: 'driver_id', nullable: true })
  driverId!: string;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId!: string;

  // Refundi
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount!: number;

  @Column({ name: 'refund_processed_at', type: 'timestamp', nullable: true })
  refundProcessedAt!: Date;

  @Column({ name: 'refund_transaction_id', nullable: true })
  refundTransactionId!: string;

  // Miratimi
  @Column({ name: 'approved_by', nullable: true })
  approvedBy!: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt!: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string;

  // Shënime dhe foto
  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ name: 'photo_urls', type: 'text', array: true, nullable: true })
  photoUrls!: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}