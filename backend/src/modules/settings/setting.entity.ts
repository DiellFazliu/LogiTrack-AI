import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../organizations/organization.entity';

@Entity('settings')
@Index(['organizationId', 'key'], { unique: true })
@Index(['key'])
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', nullable: true, type: 'uuid' })
  organizationId!: string | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization | null;

  @Column()
  key!: string;

  @Column({ type: 'text', nullable: true })
  value!: string;

  @Column({ name: 'data_type', default: 'string' })
  dataType!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'is_public', default: false })
  isPublic!: boolean;

  @Column({ name: 'is_encrypted', default: false })
  isEncrypted!: boolean;

  @Column({ name: 'group', nullable: true })
  group!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}