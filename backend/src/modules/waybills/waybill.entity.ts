// waybill.entity.ts
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
import { User } from '../users/user.entity';

@Entity('waybills')
@Index(['waybillNumber'])
@Index(['shipmentId'])
export class Waybill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'shipment_id', type: 'uuid' })
  shipmentId!: string;

  @ManyToOne(() => Shipment, { eager: true })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;

  @Column({ name: 'waybill_number', unique: true })
  waybillNumber!: string;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl?: string;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode?: string;

  @Column({ type: 'text', nullable: true })
  signature?: string;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt?: Date;

  @Column({ name: 'generated_by', nullable: true })
  generatedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generated_by' })
  generator?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}