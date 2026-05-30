// src/modules/reports/reports.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar', nullable: true })
  title!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: any;

  @Column({ name: 'generated_by', type: 'uuid', nullable: true })
  generatedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generated_by' })
  user!: User;

  @Column({ name: 'file_url', type: 'varchar', nullable: true })
  fileUrl!: string;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt!: Date;
}