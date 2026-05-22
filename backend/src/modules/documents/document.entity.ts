import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shipment } from '../shipments/shipment.entity';
import { User } from '../users/user.entity';

export enum DocumentType {
  INVOICE = 'invoice',
  WAYBILL = 'waybill',
  DELIVERY_PROOF = 'delivery_proof',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ name: 'shipment_id', nullable: true })
  shipmentId!: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;

  @Column({ name: 'document_number', unique: true })
  documentNumber!: string;

  @Column({ type: 'enum', enum: DocumentType, name: 'document_type' })
  documentType!: DocumentType;

  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'file_url' })
  fileUrl!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader!: User;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;
}