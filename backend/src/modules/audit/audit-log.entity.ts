import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';

@Entity('audit_logs')
@Index(['organizationId'])
@Index(['userId'])
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', nullable: true, type: 'uuid' })
  organizationId!: string | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization | null;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column()
  action!: string;

  @Column({ name: 'method', nullable: true })
  method!: string;

  @Column({ name: 'url', nullable: true, type: 'text' })
  url!: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType!: string;

  @Column({ name: 'entity_id', nullable: true, type: 'uuid' })
  entityId!: string | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress!: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode!: number;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true })
  responseTimeMs!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}