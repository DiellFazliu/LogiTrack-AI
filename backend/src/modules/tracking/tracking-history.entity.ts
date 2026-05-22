import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Shipment } from '../shipments/shipment.entity';

@Entity('tracking_history')
@Index(['shipmentId', 'trackedAt'])
@Index(['shipmentId'])
export class TrackingHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'shipment_id', type: 'uuid' })
  shipmentId!: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude!: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude!: number;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed!: number;

  @Column({ type: 'int', nullable: true })
  heading!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy!: number;

  @Column({ name: 'battery_level', type: 'int', nullable: true })
  batteryLevel!: number;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo: any;

  @Column({ name: 'is_offline', default: false })
  isOffline!: boolean;

  @CreateDateColumn({ name: 'tracked_at' })
  trackedAt!: Date;
}