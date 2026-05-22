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
  pdfUrl!: string;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode!: string;

  @Column({ type: 'text', nullable: true })
  signature!: string;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt!: Date;

  @Column({ name: 'signed_by', nullable: true })
  signedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'signed_by' })
  signer!: User;

  @Column({ name: 'generated_by', nullable: true })
  generatedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generated_by' })
  generator!: User;

  @Column({ name: 'pdf_data', type: 'bytea', nullable: true })
  pdfData!: Buffer;

  @Column({ name: 'is_signed', default: false })
  isSigned!: boolean;

  @Column({ name: 'is_printed', default: false })
  isPrinted!: boolean;

  @Column({ name: 'printed_at', type: 'timestamp', nullable: true })
  printedAt!: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}