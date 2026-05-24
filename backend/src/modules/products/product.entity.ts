import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../organizations/organization.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (organization) => organization.products)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ unique: true })
  sku!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', nullable: true })  // ✅ Specifiko tipin 'varchar'
  category?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  price?: number | null;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight_kg?: number | null;

  @Column({ name: 'volume_m3', type: 'decimal', precision: 10, scale: 2, nullable: true })
  volume_m3?: number | null;

  @Column({ type: 'boolean', default: false })
  hazardous!: boolean;

  @Column({ type: 'boolean', default: false })
  fragile!: boolean;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}