// audit-log.entity.ts - VERSIONI I SAKTË (pa kolonat shtesë)
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

  @Column({ type: 'varchar' })
  action!: string;

  @Column({ name: 'entity_type', nullable: true, type: 'varchar' })
  entityType!: string | null;

  @Column({ name: 'entity_id', nullable: true, type: 'uuid' })
  entityId!: string | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ name: 'ip_address', nullable: true, type: 'varchar' })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}